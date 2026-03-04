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
  PartyPopper, Loader2, User, MapPin, Calendar,
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

// ─── Mock Data ───────────────────────────────────────────────────
const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];

const onboardingQuestions: OnboardingQuestion[] = [
  { id: 'q1', question: 'Uniform / Shirt Size', description: 'Select your preferred uniform size for ordering', type: 'dropdown', required: true, options: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] },
  { id: 'q2', question: 'Dietary Requirements', description: 'Any allergies or dietary needs we should know about', type: 'checkbox', required: false, options: ['Vegetarian', 'Vegan', 'Gluten Free', 'Halal', 'Kosher', 'Nut Allergy', 'Lactose Intolerant', 'None'] },
  { id: 'q3', question: 'Emergency Contact Name', description: 'Full name of your primary emergency contact', type: 'text', required: true },
  { id: 'q4', question: 'Emergency Contact Phone', description: 'Phone number for your emergency contact', type: 'text', required: true },
  { id: 'q5', question: 'Emergency Contact Relationship', description: 'Relationship to you (e.g. spouse, parent)', type: 'dropdown', required: true, options: ['Spouse/Partner', 'Parent', 'Sibling', 'Friend', 'Other'] },
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
  q1: Shirt, q2: UtensilsCrossed, q3: Phone, q4: Phone, q5: Heart,
  q6: Car, q7: Languages, q10: FileText,
};

// ─── Steps ───────────────────────────────────────────────────────
type Step = 'details' | 'questions' | 'documents' | 'contracts' | 'complete';
const steps: { key: Step; label: string }[] = [
  { key: 'details', label: 'Your Details' },
  { key: 'questions', label: 'Onboarding Questions' },
  { key: 'documents', label: 'Documents' },
  { key: 'contracts', label: 'Contracts' },
  { key: 'complete', label: 'Complete' },
];

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

// ─── Component ───────────────────────────────────────────────────
export function EmployeeOnboardingPanel() {
  const [currentStep, setCurrentStep] = useState<Step>('details');
  // Step 1 — Personal Details
  const [personalDetails, setPersonalDetails] = useState({
    firstName: '', middleName: '', lastName: '', preferredName: '',
    email: '', mobilePhone: '', workPhone: '', gender: '', dateOfBirth: '',
    address: '', suburb: '', state: '', postcode: '',
  });
  // Step 2 — Onboarding Questions
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  // Step 3 — Uploads
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  // Step 4 — Contracts
  const [contracts, setContracts] = useState<ContractDocument[]>(contractDocuments);
  const [submitting, setSubmitting] = useState(false);

  const stepIndex = steps.findIndex(s => s.key === currentStep);

  // ─── Progress Calculation ──────────────────────────────────────
  const detailsRequiredFields = ['firstName', 'lastName', 'email', 'mobilePhone'] as const;
  const detailsFilled = detailsRequiredFields.filter(f => personalDetails[f].trim() !== '').length;

  const requiredQuestions = onboardingQuestions.filter(q => q.required && q.type !== 'file_upload');
  const answeredQuestions = requiredQuestions.filter(q => {
    const a = answers[q.id];
    return a && (Array.isArray(a) ? a.length > 0 : a.trim() !== '');
  }).length;

  const fileQuestions = onboardingQuestions.filter(q => q.type === 'file_upload' && q.required);
  const uploadedCount = fileQuestions.filter(q => !!uploadedFiles[q.id]).length;

  const acknowledgedContracts = contracts.filter(c => c.acknowledged).length;

  const totalItems = detailsRequiredFields.length + requiredQuestions.length + fileQuestions.length + contracts.length;
  const completedItems = detailsFilled + answeredQuestions + uploadedCount + acknowledgedContracts;
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

  const canProceed = () => {
    if (currentStep === 'details') {
      return detailsRequiredFields.every(f => personalDetails[f].trim() !== '');
    }
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

  const stepOrder: Step[] = ['details', 'questions', 'documents', 'contracts', 'complete'];
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
          <div className="flex items-center justify-between">
            {steps.map((step, i) => {
              const isActive = i === stepIndex;
              const isDone = i < stepIndex;
              return (
                <div key={step.key} className="flex items-center gap-2">
                  <div className={cn(
                    'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                    isDone ? 'bg-emerald-500 text-white' :
                    isActive ? 'bg-primary text-primary-foreground' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={cn(
                    'text-sm hidden sm:inline',
                    isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  )}>{step.label}</span>
                  {i < steps.length - 1 && (
                    <div className={cn(
                      'hidden sm:block w-8 h-px mx-1',
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
            {/* Name */}
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

            {/* Contact */}
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

            {/* Personal */}
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

            {/* Address */}
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

      {/* ═══════ STEP 2: Onboarding Questions ═══════ */}
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

      {/* ═══════ STEP 3: Documents ═══════ */}
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

      {/* ═══════ STEP 4: Contracts ═══════ */}
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
