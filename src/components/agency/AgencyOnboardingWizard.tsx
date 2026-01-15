import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/mui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
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
    legalName: '',
    tradingName: '',
    abn: '',
    acn: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    address: {
      street: '',
      suburb: '',
      state: '',
      postcode: '',
    },
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
    // Simulate ABN validation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock validation - in production, call ABR API
    const isValid = businessDetails.abn.replace(/\s/g, '').startsWith('1') || 
                    businessDetails.abn.replace(/\s/g, '').startsWith('5');
    
    setAbnValid(isValid);
    setIsValidatingAbn(false);
    
    if (isValid) {
      toast.success('ABN verified successfully');
    } else {
      toast.error('ABN could not be verified. Please check and try again.');
    }
  };

  const handleDocumentUpload = (type: DocumentUpload['type'], files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const newDoc: DocumentUpload = {
      id: `doc-${Date.now()}`,
      type,
      name: REQUIRED_DOCUMENTS.find(d => d.type === type)?.label || type,
      fileName: file.name,
      status: 'uploaded',
    };
    
    setDocuments(prev => [...prev.filter(d => d.type !== type), newDoc]);
    toast.success(`${newDoc.name} uploaded successfully`);
  };

  const addRateCard = () => {
    setRateCards(prev => [...prev, {
      id: `rate-${Date.now()}`,
      roleName: '',
      baseRate: 0,
      casualLoading: 25,
      weekendRate: 0,
      publicHolidayRate: 0,
    }]);
  };

  const removeRateCard = (id: string) => {
    setRateCards(prev => prev.filter(r => r.id !== id));
  };

  const updateRateCard = (id: string, field: keyof RateCardEntry, value: string | number) => {
    setRateCards(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addCoverageZone = () => {
    setCoverageZones(prev => [...prev, {
      id: `zone-${Date.now()}`,
      name: '',
      postcodes: '',
      slaMinutes: 60,
    }]);
  };

  const removeCoverageZone = (id: string) => {
    setCoverageZones(prev => prev.filter(z => z.id !== id));
  };

  const updateCoverageZone = (id: string, field: keyof CoverageZoneEntry, value: string | number) => {
    setCoverageZones(prev => prev.map(z => z.id === id ? { ...z, [field]: value } : z));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return businessDetails.legalName && businessDetails.abn && abnValid &&
               businessDetails.contactName && businessDetails.contactEmail;
      case 1:
        return REQUIRED_DOCUMENTS.every(req => 
          documents.some(d => d.type === req.type && d.status === 'uploaded')
        );
      case 2:
        return rateCards.some(r => r.roleName && r.baseRate > 0);
      case 3:
        return coverageZones.some(z => z.name && z.postcodes);
      default:
        return true;
    }
  };

  const handleSubmit = () => {
    const data: OnboardingData = {
      businessDetails,
      documents,
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
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="legalName">Legal Business Name *</Label>
                <Input
                  id="legalName"
                  value={businessDetails.legalName}
                  onChange={e => setBusinessDetails(prev => ({ ...prev, legalName: e.target.value }))}
                  placeholder="e.g., ABC Staffing Pty Ltd"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tradingName">Trading Name</Label>
                <Input
                  id="tradingName"
                  value={businessDetails.tradingName}
                  onChange={e => setBusinessDetails(prev => ({ ...prev, tradingName: e.target.value }))}
                  placeholder="e.g., ABC Staffing"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="abn">ABN *</Label>
                <div className="flex gap-2">
                  <Input
                    id="abn"
                    value={businessDetails.abn}
                    onChange={e => {
                      setBusinessDetails(prev => ({ ...prev, abn: e.target.value }));
                      setAbnValid(null);
                    }}
                    placeholder="12 345 678 901"
                    className={cn(
                      abnValid === true && 'border-green-500',
                      abnValid === false && 'border-red-500'
                    )}
                  />
                  <Button 
                    variant="outlined" 
                    onClick={validateAbn}
                    disabled={isValidatingAbn || !businessDetails.abn}
                  >
                    {isValidatingAbn ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : abnValid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      'Verify'
                    )}
                  </Button>
                </div>
                {abnValid === false && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> ABN could not be verified
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="acn">ACN (optional)</Label>
                <Input
                  id="acn"
                  value={businessDetails.acn}
                  onChange={e => setBusinessDetails(prev => ({ ...prev, acn: e.target.value }))}
                  placeholder="123 456 789"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">Primary Contact</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Full Name *</Label>
                  <Input
                    id="contactName"
                    value={businessDetails.contactName}
                    onChange={e => setBusinessDetails(prev => ({ ...prev, contactName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={businessDetails.contactEmail}
                    onChange={e => setBusinessDetails(prev => ({ ...prev, contactEmail: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Phone</Label>
                  <Input
                    id="contactPhone"
                    value={businessDetails.contactPhone}
                    onChange={e => setBusinessDetails(prev => ({ ...prev, contactPhone: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">Business Address</h4>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={businessDetails.address.street}
                    onChange={e => setBusinessDetails(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, street: e.target.value }
                    }))}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="suburb">Suburb</Label>
                    <Input
                      id="suburb"
                      value={businessDetails.address.suburb}
                      onChange={e => setBusinessDetails(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, suburb: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={businessDetails.address.state}
                      onChange={e => setBusinessDetails(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, state: e.target.value }
                      }))}
                      placeholder="NSW"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input
                      id="postcode"
                      value={businessDetails.address.postcode}
                      onChange={e => setBusinessDetails(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, postcode: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">Service Categories</h4>
              <div className="flex flex-wrap gap-2">
                {SERVICE_CATEGORIES.map(category => (
                  <Badge
                    key={category}
                    variant={serviceCategories.includes(category) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      setServiceCategories(prev => 
                        prev.includes(category) 
                          ? prev.filter(c => c !== category)
                          : [...prev, category]
                      );
                    }}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload the required compliance documents. All documents must be current and valid.
            </p>
            
            {REQUIRED_DOCUMENTS.map(doc => {
              const uploaded = documents.find(d => d.type === doc.type);
              
              return (
                <Card key={doc.type} className={cn(
                  uploaded?.status === 'uploaded' && 'border-green-200 bg-green-50 dark:bg-green-950/20'
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center",
                          uploaded ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
                        )}>
                          {uploaded ? <CheckCircle2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium">{doc.label}</p>
                          {uploaded && (
                            <p className="text-sm text-muted-foreground">{uploaded.fileName}</p>
                          )}
                        </div>
                        {doc.required && !uploaded && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </div>
                      
                      <div>
                        <input
                          type="file"
                          id={`upload-${doc.type}`}
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={e => handleDocumentUpload(doc.type, e.target.files)}
                        />
                        <Button
                          variant={uploaded ? 'outlined' : 'contained'}
                          size="small"
                          onClick={() => document.getElementById(`upload-${doc.type}`)?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploaded ? 'Replace' : 'Upload'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Additional Documents</p>
                      <p className="text-sm text-muted-foreground">Upload any other relevant certifications</p>
                    </div>
                  </div>
                  <Button variant="outlined" size="small">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set up your standard rate cards for different roles. These can be customized per client later.
            </p>
            
            {rateCards.map((rate, idx) => (
              <Card key={rate.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-medium">Rate Card {idx + 1}</h4>
                    {rateCards.length > 1 && (
                      <Button variant="ghost" size="small" onClick={() => removeRateCard(rate.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-5">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Role Name</Label>
                      <Input
                        value={rate.roleName}
                        onChange={e => updateRateCard(rate.id, 'roleName', e.target.value)}
                        placeholder="e.g., Registered Nurse"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Base Rate ($)</Label>
                      <Input
                        type="number"
                        value={rate.baseRate || ''}
                        onChange={e => updateRateCard(rate.id, 'baseRate', parseFloat(e.target.value) || 0)}
                        placeholder="45.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Weekend Rate ($)</Label>
                      <Input
                        type="number"
                        value={rate.weekendRate || ''}
                        onChange={e => updateRateCard(rate.id, 'weekendRate', parseFloat(e.target.value) || 0)}
                        placeholder="56.25"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Public Holiday ($)</Label>
                      <Input
                        type="number"
                        value={rate.publicHolidayRate || ''}
                        onChange={e => updateRateCard(rate.id, 'publicHolidayRate', parseFloat(e.target.value) || 0)}
                        placeholder="90.00"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button variant="outlined" onClick={addRateCard} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Rate Card
            </Button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Define your coverage zones with postcodes and response SLA times.
            </p>
            
            {coverageZones.map((zone, idx) => (
              <Card key={zone.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-medium">Coverage Zone {idx + 1}</h4>
                    {coverageZones.length > 1 && (
                      <Button variant="ghost" size="small" onClick={() => removeCoverageZone(zone.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Zone Name</Label>
                      <Input
                        value={zone.name}
                        onChange={e => updateCoverageZone(zone.id, 'name', e.target.value)}
                        placeholder="e.g., Sydney CBD"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Postcodes (comma-separated)</Label>
                      <Input
                        value={zone.postcodes}
                        onChange={e => updateCoverageZone(zone.id, 'postcodes', e.target.value)}
                        placeholder="2000, 2001, 2002"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Response SLA (minutes)</Label>
                      <Input
                        type="number"
                        value={zone.slaMinutes}
                        onChange={e => updateCoverageZone(zone.id, 'slaMinutes', parseInt(e.target.value) || 60)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button variant="outlined" onClick={addCoverageZone} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Coverage Zone
            </Button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Business Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Legal Name</span>
                  <span className="font-medium">{businessDetails.legalName || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ABN</span>
                  <span className="font-medium flex items-center gap-1">
                    {businessDetails.abn || '-'}
                    {abnValid && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contact</span>
                  <span className="font-medium">{businessDetails.contactName || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categories</span>
                  <span className="font-medium">{serviceCategories.join(', ') || '-'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Compliance Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {REQUIRED_DOCUMENTS.map(doc => {
                  const uploaded = documents.find(d => d.type === doc.type);
                  return (
                    <div key={doc.type} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{doc.label}</span>
                      {uploaded ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Uploaded
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Missing</Badge>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Rate Cards ({rateCards.filter(r => r.roleName && r.baseRate > 0).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {rateCards.filter(r => r.roleName && r.baseRate > 0).map(rate => (
                  <div key={rate.id} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{rate.roleName}</span>
                    <span className="font-medium">${rate.baseRate.toFixed(2)}/hr</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Coverage Zones ({coverageZones.filter(z => z.name && z.postcodes).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {coverageZones.filter(z => z.name && z.postcodes).map(zone => (
                  <div key={zone.id} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{zone.name}</span>
                    <span className="font-medium">{zone.slaMinutes}min SLA</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Agency Onboarding</DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {STEPS.map((step, idx) => (
              <div 
                key={step.id}
                className={cn(
                  "flex flex-col items-center gap-1 text-xs",
                  idx <= currentStep ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center",
                  idx < currentStep ? 'bg-primary text-primary-foreground' :
                  idx === currentStep ? 'bg-primary/20 text-primary border-2 border-primary' :
                  'bg-muted'
                )}>
                  {idx < currentStep ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <span className="hidden md:block">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {renderStepContent()}
        </div>

        {/* Actions */}
        <div className="flex justify-between border-t pt-4">
          <Button
            variant="outlined"
            onClick={() => currentStep === 0 ? onClose() : setCurrentStep(prev => prev - 1)}
          >
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </Button>
          
          {currentStep === STEPS.length - 1 ? (
            <Button variant="contained" onClick={handleSubmit}>
              Complete Onboarding
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceed()}
            >
              Continue
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgencyOnboardingWizard;
