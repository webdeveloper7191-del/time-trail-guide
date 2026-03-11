import { useState } from 'react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';
import { Button } from '@/components/mui/Button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, FileText, DollarSign, MapPin, CheckCircle2, 
  Upload, AlertCircle, Loader2, Plus, X, Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AgencyOnboardingWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (data: OnboardingData) => void;
}

interface OnboardingData {
  businessDetails: {
    legalName: string;
    tradingName: string;
    abn: string;
    acn: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    address: {
      street: string;
      suburb: string;
      state: string;
      postcode: string;
    };
  };
  documents: DocumentUpload[];
  rateCards: RateCardEntry[];
  coverageZones: CoverageZoneEntry[];
  serviceCategories: string[];
}

interface DocumentUpload {
  id: string;
  type: 'public_liability' | 'professional_indemnity' | 'workers_comp' | 'abn_certificate' | 'other';
  name: string;
  fileName: string;
  status: 'pending' | 'uploaded' | 'verified';
}

interface RateCardEntry {
  id: string;
  roleName: string;
  baseRate: number;
  casualLoading: number;
  weekendRate: number;
  publicHolidayRate: number;
}

interface CoverageZoneEntry {
  id: string;
  name: string;
  postcodes: string;
  slaMinutes: number;
}

const STEPS = [
  { id: 'business', label: 'Business Details', icon: Building2 },
  { id: 'documents', label: 'Compliance Documents', icon: FileText },
  { id: 'rates', label: 'Rate Cards', icon: DollarSign },
  { id: 'coverage', label: 'Coverage Zones', icon: MapPin },
  { id: 'review', label: 'Review & Submit', icon: CheckCircle2 },
];

const REQUIRED_DOCUMENTS = [
  { type: 'public_liability' as const, label: 'Public Liability Insurance', required: true },
  { type: 'professional_indemnity' as const, label: 'Professional Indemnity Insurance', required: true },
  { type: 'workers_comp' as const, label: 'Workers Compensation Insurance', required: true },
  { type: 'abn_certificate' as const, label: 'ABN Certificate', required: true },
];

const SERVICE_CATEGORIES = [
  'Healthcare', 'Hospitality', 'Childcare', 'Aged Care', 'Logistics', 'Events', 'Administration', 'Retail'
];

const AgencyOnboardingWizard = ({ open, onClose, onComplete }: AgencyOnboardingWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isValidatingAbn, setIsValidatingAbn] = useState(false);
  const [abnValid, setAbnValid] = useState<boolean | null>(null);

  const [businessDetails, setBusinessDetails] = useState({
    legalName: '', tradingName: '', abn: '', acn: '',
    contactName: '', contactEmail: '', contactPhone: '',
    address: { street: '', suburb: '', state: '', postcode: '' },
  });

  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [rateCards, setRateCards] = useState<RateCardEntry[]>([
    { id: '1', roleName: '', baseRate: 0, casualLoading: 25, weekendRate: 0, publicHolidayRate: 0 }
  ]);
  const [coverageZones, setCoverageZones] = useState<CoverageZoneEntry[]>([
    { id: '1', name: '', postcodes: '', slaMinutes: 60 }
  ]);
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const validateAbn = async () => {
    if (businessDetails.abn.replace(/\s/g, '').length !== 11) {
      toast.error('ABN must be 11 digits');
      return;
    }
    setIsValidatingAbn(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const isValid = businessDetails.abn.replace(/\s/g, '').startsWith('1') || 
                    businessDetails.abn.replace(/\s/g, '').startsWith('5');
    setAbnValid(isValid);
    setIsValidatingAbn(false);
    if (isValid) toast.success('ABN verified successfully');
    else toast.error('ABN could not be verified. Please check and try again.');
  };

  const handleDocumentUpload = (type: DocumentUpload['type'], files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const newDoc: DocumentUpload = {
      id: `doc-${Date.now()}`, type,
      name: REQUIRED_DOCUMENTS.find(d => d.type === type)?.label || type,
      fileName: file.name, status: 'uploaded',
    };
    setDocuments(prev => [...prev.filter(d => d.type !== type), newDoc]);
    toast.success(`${newDoc.name} uploaded successfully`);
  };

  const addRateCard = () => {
    setRateCards(prev => [...prev, { id: `rate-${Date.now()}`, roleName: '', baseRate: 0, casualLoading: 25, weekendRate: 0, publicHolidayRate: 0 }]);
  };
  const removeRateCard = (id: string) => setRateCards(prev => prev.filter(r => r.id !== id));
  const updateRateCard = (id: string, field: keyof RateCardEntry, value: string | number) => {
    setRateCards(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addCoverageZone = () => {
    setCoverageZones(prev => [...prev, { id: `zone-${Date.now()}`, name: '', postcodes: '', slaMinutes: 60 }]);
  };
  const removeCoverageZone = (id: string) => setCoverageZones(prev => prev.filter(z => z.id !== id));
  const updateCoverageZone = (id: string, field: keyof CoverageZoneEntry, value: string | number) => {
    setCoverageZones(prev => prev.map(z => z.id === id ? { ...z, [field]: value } : z));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return businessDetails.legalName && businessDetails.abn && abnValid && businessDetails.contactName && businessDetails.contactEmail;
      case 1: return REQUIRED_DOCUMENTS.every(req => documents.some(d => d.type === req.type && d.status === 'uploaded'));
      case 2: return rateCards.some(r => r.roleName && r.baseRate > 0);
      case 3: return coverageZones.some(z => z.name && z.postcodes);
      default: return true;
    }
  };

  const handleSubmit = () => {
    const data: OnboardingData = {
      businessDetails, documents,
      rateCards: rateCards.filter(r => r.roleName && r.baseRate > 0),
      coverageZones: coverageZones.filter(z => z.name && z.postcodes),
      serviceCategories,
    };
    onComplete(data);
    toast.success('Agency onboarding completed successfully!');
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <FormSection title="Business Information">
              <FormRow>
                <FormField label="Legal Business Name" required>
                  <Input value={businessDetails.legalName} onChange={e => setBusinessDetails(prev => ({ ...prev, legalName: e.target.value }))} placeholder="e.g., ABC Staffing Pty Ltd" />
                </FormField>
                <FormField label="Trading Name">
                  <Input value={businessDetails.tradingName} onChange={e => setBusinessDetails(prev => ({ ...prev, tradingName: e.target.value }))} placeholder="e.g., ABC Staffing" />
                </FormField>
              </FormRow>
              <FormRow>
                <FormField label="ABN" required>
                  <div className="flex gap-2">
                    <Input value={businessDetails.abn} onChange={e => { setBusinessDetails(prev => ({ ...prev, abn: e.target.value })); setAbnValid(null); }} placeholder="12 345 678 901" className={cn(abnValid === true && 'border-green-500', abnValid === false && 'border-red-500')} />
                    <Button variant="outlined" onClick={validateAbn} disabled={isValidatingAbn || !businessDetails.abn}>
                      {isValidatingAbn ? <Loader2 className="h-4 w-4 animate-spin" /> : abnValid ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : 'Verify'}
                    </Button>
                  </div>
                  {abnValid === false && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" /> ABN could not be verified</p>}
                </FormField>
                <FormField label="ACN (optional)">
                  <Input value={businessDetails.acn} onChange={e => setBusinessDetails(prev => ({ ...prev, acn: e.target.value }))} placeholder="123 456 789" />
                </FormField>
              </FormRow>
            </FormSection>

            <FormSection title="Primary Contact">
              <FormRow columns={3}>
                <FormField label="Full Name" required>
                  <Input value={businessDetails.contactName} onChange={e => setBusinessDetails(prev => ({ ...prev, contactName: e.target.value }))} />
                </FormField>
                <FormField label="Email" required>
                  <Input type="email" value={businessDetails.contactEmail} onChange={e => setBusinessDetails(prev => ({ ...prev, contactEmail: e.target.value }))} />
                </FormField>
                <FormField label="Phone">
                  <Input value={businessDetails.contactPhone} onChange={e => setBusinessDetails(prev => ({ ...prev, contactPhone: e.target.value }))} />
                </FormField>
              </FormRow>
            </FormSection>

            <FormSection title="Business Address">
              <FormField label="Street Address">
                <Input value={businessDetails.address.street} onChange={e => setBusinessDetails(prev => ({ ...prev, address: { ...prev.address, street: e.target.value } }))} />
              </FormField>
              <FormRow columns={3}>
                <FormField label="Suburb">
                  <Input value={businessDetails.address.suburb} onChange={e => setBusinessDetails(prev => ({ ...prev, address: { ...prev.address, suburb: e.target.value } }))} />
                </FormField>
                <FormField label="State">
                  <Input value={businessDetails.address.state} onChange={e => setBusinessDetails(prev => ({ ...prev, address: { ...prev.address, state: e.target.value } }))} placeholder="NSW" />
                </FormField>
                <FormField label="Postcode">
                  <Input value={businessDetails.address.postcode} onChange={e => setBusinessDetails(prev => ({ ...prev, address: { ...prev.address, postcode: e.target.value } }))} />
                </FormField>
              </FormRow>
            </FormSection>

            <FormSection title="Service Categories">
              <div className="flex flex-wrap gap-2">
                {SERVICE_CATEGORIES.map(category => (
                  <Badge key={category} variant={serviceCategories.includes(category) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setServiceCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category])}>{category}</Badge>
                ))}
              </div>
            </FormSection>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <FormSection title="Required Documents" tooltip="Upload current and valid compliance documents">
              <p className="text-sm text-muted-foreground mb-2">All documents must be current and valid.</p>
              {REQUIRED_DOCUMENTS.map(doc => {
                const uploaded = documents.find(d => d.type === doc.type);
                return (
                  <div key={doc.type} className={cn('flex items-center justify-between p-3 rounded-lg border', uploaded?.status === 'uploaded' && 'border-green-200 bg-green-50/50')}>
                    <div className="flex items-center gap-3">
                      <div className={cn('h-9 w-9 rounded-full flex items-center justify-center', uploaded ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground')}>
                        {uploaded ? <CheckCircle2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{doc.label}</p>
                        {uploaded && <p className="text-xs text-muted-foreground">{uploaded.fileName}</p>}
                      </div>
                      {doc.required && !uploaded && <Badge variant="destructive" className="text-xs">Required</Badge>}
                    </div>
                    <div>
                      <input type="file" id={`upload-${doc.type}`} className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleDocumentUpload(doc.type, e.target.files)} />
                      <Button variant={uploaded ? 'outlined' : 'contained'} size="small" onClick={() => document.getElementById(`upload-${doc.type}`)?.click()}>
                        <Upload className="h-3.5 w-3.5 mr-1.5" />{uploaded ? 'Replace' : 'Upload'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </FormSection>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            {rateCards.map((rate, idx) => (
              <FormSection key={rate.id} title={`Rate Card ${idx + 1}`}>
                <div className="flex justify-end -mt-2 mb-2">
                  {rateCards.length > 1 && <Button variant="ghost" size="small" onClick={() => removeRateCard(rate.id)}><X className="h-4 w-4" /></Button>}
                </div>
                <FormField label="Role Name">
                  <Input value={rate.roleName} onChange={e => updateRateCard(rate.id, 'roleName', e.target.value)} placeholder="e.g., Registered Nurse" />
                </FormField>
                <FormRow columns={3}>
                  <FormField label="Base Rate ($)">
                    <Input type="number" value={rate.baseRate || ''} onChange={e => updateRateCard(rate.id, 'baseRate', parseFloat(e.target.value) || 0)} placeholder="45.00" />
                  </FormField>
                  <FormField label="Weekend Rate ($)">
                    <Input type="number" value={rate.weekendRate || ''} onChange={e => updateRateCard(rate.id, 'weekendRate', parseFloat(e.target.value) || 0)} placeholder="56.25" />
                  </FormField>
                  <FormField label="Public Holiday ($)">
                    <Input type="number" value={rate.publicHolidayRate || ''} onChange={e => updateRateCard(rate.id, 'publicHolidayRate', parseFloat(e.target.value) || 0)} placeholder="90.00" />
                  </FormField>
                </FormRow>
              </FormSection>
            ))}
            <Button variant="outlined" onClick={addRateCard} className="w-full"><Plus className="h-4 w-4 mr-2" />Add Rate Card</Button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            {coverageZones.map((zone, idx) => (
              <FormSection key={zone.id} title={`Coverage Zone ${idx + 1}`}>
                <div className="flex justify-end -mt-2 mb-2">
                  {coverageZones.length > 1 && <Button variant="ghost" size="small" onClick={() => removeCoverageZone(zone.id)}><X className="h-4 w-4" /></Button>}
                </div>
                <FormRow columns={3}>
                  <FormField label="Zone Name">
                    <Input value={zone.name} onChange={e => updateCoverageZone(zone.id, 'name', e.target.value)} placeholder="e.g., Sydney CBD" />
                  </FormField>
                  <FormField label="Postcodes (comma-separated)">
                    <Input value={zone.postcodes} onChange={e => updateCoverageZone(zone.id, 'postcodes', e.target.value)} placeholder="2000, 2001, 2002" />
                  </FormField>
                  <FormField label="Response SLA (minutes)">
                    <Input type="number" value={zone.slaMinutes} onChange={e => updateCoverageZone(zone.id, 'slaMinutes', parseInt(e.target.value) || 60)} />
                  </FormField>
                </FormRow>
              </FormSection>
            ))}
            <Button variant="outlined" onClick={addCoverageZone} className="w-full"><Plus className="h-4 w-4 mr-2" />Add Coverage Zone</Button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <FormSection title="Business Details">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Legal Name</span><span className="font-medium">{businessDetails.legalName || '-'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">ABN</span><span className="font-medium flex items-center gap-1">{businessDetails.abn || '-'}{abnValid && <CheckCircle2 className="h-3 w-3 text-green-500" />}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Contact</span><span className="font-medium">{businessDetails.contactName || '-'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Categories</span><span className="font-medium">{serviceCategories.join(', ') || '-'}</span></div>
              </div>
            </FormSection>
            <FormSection title="Compliance Documents">
              <div className="space-y-2">
                {REQUIRED_DOCUMENTS.map(doc => {
                  const uploaded = documents.find(d => d.type === doc.type);
                  return (
                    <div key={doc.type} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{doc.label}</span>
                      {uploaded ? <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Uploaded</Badge> : <Badge variant="destructive">Missing</Badge>}
                    </div>
                  );
                })}
              </div>
            </FormSection>
            <FormSection title={`Rate Cards (${rateCards.filter(r => r.roleName && r.baseRate > 0).length})`}>
              <div className="space-y-2">
                {rateCards.filter(r => r.roleName && r.baseRate > 0).map(rate => (
                  <div key={rate.id} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{rate.roleName}</span>
                    <span className="font-medium">${rate.baseRate.toFixed(2)}/hr</span>
                  </div>
                ))}
              </div>
            </FormSection>
            <FormSection title={`Coverage Zones (${coverageZones.filter(z => z.name && z.postcodes).length})`}>
              <div className="space-y-2">
                {coverageZones.filter(z => z.name && z.postcodes).map(zone => (
                  <div key={zone.id} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{zone.name}</span>
                    <span className="font-medium">{zone.slaMinutes}min SLA</span>
                  </div>
                ))}
              </div>
            </FormSection>
          </div>
        );

      default: return null;
    }
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Agency Onboarding"
      description={STEPS[currentStep]?.label}
      icon={Building2}
      size="xl"
      isBackground
      actions={[
        {
          label: currentStep === 0 ? 'Cancel' : 'Back',
          variant: 'outlined',
          onClick: () => currentStep === 0 ? onClose() : setCurrentStep(prev => prev - 1),
        },
        currentStep === STEPS.length - 1
          ? { label: 'Complete Onboarding', variant: 'primary', onClick: handleSubmit }
          : { label: 'Continue', variant: 'primary', onClick: () => setCurrentStep(prev => prev + 1), disabled: !canProceed() },
      ]}
    >
      {/* Progress */}
      <div className="rounded-lg border border-border bg-background p-4 space-y-3">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between">
          {STEPS.map((step, idx) => (
            <div key={step.id} className={cn('flex flex-col items-center gap-1 text-xs', idx <= currentStep ? 'text-primary' : 'text-muted-foreground')}>
              <div className={cn('h-7 w-7 rounded-full flex items-center justify-center', idx < currentStep ? 'bg-primary text-primary-foreground' : idx === currentStep ? 'bg-primary/20 text-primary border-2 border-primary' : 'bg-muted')}>
                {idx < currentStep ? <CheckCircle2 className="h-3.5 w-3.5" /> : <step.icon className="h-3.5 w-3.5" />}
              </div>
              <span className="hidden md:block text-[11px]">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {renderStepContent()}
    </PrimaryOffCanvas>
  );
};

export default AgencyOnboardingWizard;
