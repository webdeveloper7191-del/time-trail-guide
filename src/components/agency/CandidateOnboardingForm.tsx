import { useState } from 'react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';
import { Button } from '@/components/mui/Button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { 
  User, FileText, Briefcase, Calendar as CalendarIcon, 
  Upload, Plus, X, CheckCircle2, Loader2,
  Star, Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Candidate, CandidateSkill, CandidateCertification } from '@/types/agency';

interface CandidateOnboardingFormProps {
  open: boolean;
  onClose: () => void;
  onComplete: (candidate: Partial<Candidate>) => void;
}

const EMPLOYMENT_TYPES = [
  { value: 'casual', label: 'Casual' },
  { value: 'temp', label: 'Temporary' },
  { value: 'temp_to_perm', label: 'Temp-to-Perm' },
  { value: 'contractor', label: 'Contractor' },
];

const ROLES = [
  'Registered Nurse', 'Enrolled Nurse', 'Personal Care Assistant',
  'Chef', 'Kitchen Hand', 'Wait Staff', 'Bartender',
  'Early Childhood Teacher', 'Diploma Educator', 'Certificate III Educator',
  'Forklift Operator', 'Picker Packer', 'Warehouse Supervisor',
];

const SKILLS = [
  'Medication Administration', 'Wound Care', 'Patient Assessment', 'Dementia Care',
  'Fine Dining', 'Menu Development', 'Kitchen Management', 'Food Safety',
  'Curriculum Development', 'Child Development', 'Parent Communication',
  'Forklift Operation', 'Inventory Management', 'OH&S Compliance',
  'Customer Service', 'POS Systems', 'Event Service', 'Cocktail Making',
];

const CERTIFICATIONS = [
  { name: 'AHPRA Registration', category: 'Healthcare' },
  { name: 'First Aid Certificate', category: 'General' },
  { name: 'CPR Certificate', category: 'General' },
  { name: 'Working With Children Check', category: 'Childcare' },
  { name: 'Food Safety Supervisor', category: 'Hospitality' },
  { name: 'RSA Certificate', category: 'Hospitality' },
  { name: 'RCG Certificate', category: 'Hospitality' },
  { name: 'NDIS Worker Screening', category: 'Aged Care' },
  { name: 'Forklift Licence', category: 'Logistics' },
  { name: 'White Card', category: 'Construction' },
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CandidateOnboardingForm = ({ open, onClose, onComplete }: CandidateOnboardingFormProps) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isSaving, setIsSaving] = useState(false);

  const [personalDetails, setPersonalDetails] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    dateOfBirth: undefined as Date | undefined,
    address: { street: '', suburb: '', state: '', postcode: '' },
    taxFileNumber: '',
    emergencyContact: { name: '', phone: '', relationship: '' },
  });

  const [employmentType, setEmploymentType] = useState<string>('casual');
  const [primaryRole, setPrimaryRole] = useState<string>('');
  const [secondaryRoles, setSecondaryRoles] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState<number>(0);
  const [payRate, setPayRate] = useState<number>(0);
  const [awardClassification, setAwardClassification] = useState<string>('');
  const [selectedSkills, setSelectedSkills] = useState<CandidateSkill[]>([]);
  const [certifications, setCertifications] = useState<CandidateCertification[]>([]);
  const [availability, setAvailability] = useState<{ [key: number]: { available: boolean; start: string; end: string } }>({
    0: { available: false, start: '08:00', end: '18:00' }, 1: { available: true, start: '08:00', end: '18:00' },
    2: { available: true, start: '08:00', end: '18:00' }, 3: { available: true, start: '08:00', end: '18:00' },
    4: { available: true, start: '08:00', end: '18:00' }, 5: { available: true, start: '08:00', end: '18:00' },
    6: { available: false, start: '08:00', end: '18:00' },
  });
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [maxTravelDistance, setMaxTravelDistance] = useState<number>(25);
  const [documents, setDocuments] = useState<{ type: string; name: string; fileName: string }[]>([]);

  const toggleSkill = (skillName: string) => {
    setSelectedSkills(prev => {
      const exists = prev.find(s => s.name === skillName);
      if (exists) return prev.filter(s => s.name !== skillName);
      return [...prev, { id: `skill-${Date.now()}`, name: skillName, level: 'intermediate' as const, yearsExperience: 1 }];
    });
  };

  const addCertification = (certName: string) => {
    if (certifications.find(c => c.name === certName)) return;
    setCertifications(prev => [...prev, { id: `cert-${Date.now()}`, name: certName, issuer: '', issueDate: new Date().toISOString().split('T')[0], status: 'valid' as const }]);
  };

  const removeCertification = (id: string) => setCertifications(prev => prev.filter(c => c.id !== id));

  const handleDocumentUpload = (type: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setDocuments(prev => [...prev.filter(d => d.type !== type), { type, name: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), fileName: file.name }]);
    toast.success(`${type} uploaded`);
  };

  const getCompletionPercentage = () => {
    let completed = 0;
    if (personalDetails.firstName && personalDetails.lastName && personalDetails.email && personalDetails.phone) completed += 30;
    else if (personalDetails.firstName || personalDetails.lastName) completed += 15;
    if (primaryRole && employmentType) completed += 25;
    else if (primaryRole || employmentType) completed += 12;
    if (selectedSkills.length >= 3) completed += 20;
    else if (selectedSkills.length > 0) completed += 10;
    if (certifications.length >= 2) completed += 15;
    else if (certifications.length > 0) completed += 7;
    if (Object.values(availability).some(a => a.available)) completed += 10;
    return completed;
  };

  const handleSubmit = async () => {
    if (!personalDetails.firstName || !personalDetails.lastName || !personalDetails.email || !primaryRole) {
      toast.error('Please fill in required fields');
      return;
    }
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const candidate: Partial<Candidate> = {
      firstName: personalDetails.firstName, lastName: personalDetails.lastName,
      email: personalDetails.email, phone: personalDetails.phone,
      employmentType: employmentType as Candidate['employmentType'],
      status: 'available', primaryRole, secondaryRoles, skills: selectedSkills,
      certifications, yearsExperience, awardClassification, payRate,
      availability: Object.entries(availability).map(([day, data]) => ({
        dayOfWeek: parseInt(day), startTime: data.start, endTime: data.end, isAvailable: data.available,
      })),
      preferredLocations, maxTravelDistance,
      complianceScore: certifications.length >= 2 ? 100 : certifications.length === 1 ? 75 : 50,
      reliabilityScore: 100, averageRating: 0, totalShiftsCompleted: 0, noShowCount: 0, hoursWorkedThisWeek: 0,
    };
    onComplete(candidate);
    setIsSaving(false);
    toast.success('Candidate registered successfully!');
    onClose();
  };

  const TABS = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'employment', label: 'Employment', icon: Briefcase },
    { id: 'skills', label: 'Skills', icon: Star },
    { id: 'availability', label: 'Availability', icon: CalendarIcon },
    { id: 'documents', label: 'Documents', icon: FileText },
  ];

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Register New Candidate"
      icon={User}
      size="xl"
      isBackground
      headerActions={
        <div className="flex items-center gap-2 text-sm">
          <Progress value={getCompletionPercentage()} className="w-20 h-2" />
          <span className="text-muted-foreground text-xs">{getCompletionPercentage()}%</span>
        </div>
      }
      actions={[
        { label: 'Cancel', variant: 'outlined', onClick: onClose },
        { label: isSaving ? 'Saving...' : 'Save Candidate', variant: 'primary', onClick: handleSubmit, disabled: isSaving },
      ]}
    >
      {/* Tab Navigation */}
      <div className="rounded-lg border border-border bg-background p-1 flex gap-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium transition-colors',
              activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50'
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Personal */}
      {activeTab === 'personal' && (
        <div className="space-y-4">
          <FormSection title="Personal Details">
            <FormRow>
              <FormField label="First Name" required><Input value={personalDetails.firstName} onChange={e => setPersonalDetails(prev => ({ ...prev, firstName: e.target.value }))} /></FormField>
              <FormField label="Last Name" required><Input value={personalDetails.lastName} onChange={e => setPersonalDetails(prev => ({ ...prev, lastName: e.target.value }))} /></FormField>
            </FormRow>
            <FormRow>
              <FormField label="Email" required><Input type="email" value={personalDetails.email} onChange={e => setPersonalDetails(prev => ({ ...prev, email: e.target.value }))} /></FormField>
              <FormField label="Phone" required><Input value={personalDetails.phone} onChange={e => setPersonalDetails(prev => ({ ...prev, phone: e.target.value }))} /></FormField>
            </FormRow>
            <FormRow>
              <FormField label="Date of Birth">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outlined" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {personalDetails.dateOfBirth ? format(personalDetails.dateOfBirth, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={personalDetails.dateOfBirth} onSelect={(date) => setPersonalDetails(prev => ({ ...prev, dateOfBirth: date }))} initialFocus /></PopoverContent>
                </Popover>
              </FormField>
              <FormField label="Tax File Number"><Input value={personalDetails.taxFileNumber} onChange={e => setPersonalDetails(prev => ({ ...prev, taxFileNumber: e.target.value }))} placeholder="XXX XXX XXX" /></FormField>
            </FormRow>
          </FormSection>

          <FormSection title="Address">
            <FormField label="Street Address"><Input value={personalDetails.address.street} onChange={e => setPersonalDetails(prev => ({ ...prev, address: { ...prev.address, street: e.target.value } }))} /></FormField>
            <FormRow columns={3}>
              <FormField label="Suburb"><Input value={personalDetails.address.suburb} onChange={e => setPersonalDetails(prev => ({ ...prev, address: { ...prev.address, suburb: e.target.value } }))} /></FormField>
              <FormField label="State"><Input value={personalDetails.address.state} onChange={e => setPersonalDetails(prev => ({ ...prev, address: { ...prev.address, state: e.target.value } }))} /></FormField>
              <FormField label="Postcode"><Input value={personalDetails.address.postcode} onChange={e => setPersonalDetails(prev => ({ ...prev, address: { ...prev.address, postcode: e.target.value } }))} /></FormField>
            </FormRow>
          </FormSection>

          <FormSection title="Emergency Contact">
            <FormRow columns={3}>
              <FormField label="Full Name"><Input value={personalDetails.emergencyContact.name} onChange={e => setPersonalDetails(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, name: e.target.value } }))} /></FormField>
              <FormField label="Phone"><Input value={personalDetails.emergencyContact.phone} onChange={e => setPersonalDetails(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, phone: e.target.value } }))} /></FormField>
              <FormField label="Relationship"><Input value={personalDetails.emergencyContact.relationship} onChange={e => setPersonalDetails(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, relationship: e.target.value } }))} /></FormField>
            </FormRow>
          </FormSection>
        </div>
      )}

      {/* Employment */}
      {activeTab === 'employment' && (
        <div className="space-y-4">
          <FormSection title="Employment Details">
            <FormRow>
              <FormField label="Employment Type" required>
                <Select value={employmentType} onValueChange={setEmploymentType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EMPLOYMENT_TYPES.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
              <FormField label="Years of Experience"><Input type="number" min="0" value={yearsExperience} onChange={e => setYearsExperience(parseInt(e.target.value) || 0)} /></FormField>
            </FormRow>
            <FormField label="Primary Role" required>
              <Select value={primaryRole} onValueChange={setPrimaryRole}>
                <SelectTrigger><SelectValue placeholder="Select primary role" /></SelectTrigger>
                <SelectContent>{ROLES.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormRow>
              <FormField label="Award Classification"><Input value={awardClassification} onChange={e => setAwardClassification(e.target.value)} placeholder="e.g., RN Level 2" /></FormField>
              <FormField label="Pay Rate ($/hr)"><Input type="number" value={payRate || ''} onChange={e => setPayRate(parseFloat(e.target.value) || 0)} placeholder="0.00" /></FormField>
            </FormRow>
          </FormSection>
          <FormSection title="Secondary Roles">
            <div className="flex flex-wrap gap-2">
              {ROLES.filter(r => r !== primaryRole).map(role => (
                <Badge key={role} variant={secondaryRoles.includes(role) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setSecondaryRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])}>{role}</Badge>
              ))}
            </div>
          </FormSection>
        </div>
      )}

      {/* Skills */}
      {activeTab === 'skills' && (
        <div className="space-y-4">
          <FormSection title="Skills">
            <div className="flex flex-wrap gap-2">
              {SKILLS.map(skill => (
                <Badge key={skill} variant={selectedSkills.find(s => s.name === skill) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => toggleSkill(skill)}>{skill}</Badge>
              ))}
            </div>
          </FormSection>
          <FormSection title="Certifications">
            <div className="flex flex-wrap gap-2 mb-3">
              {CERTIFICATIONS.map(cert => (
                <Badge key={cert.name} variant={certifications.find(c => c.name === cert.name) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => addCertification(cert.name)}>{cert.name}</Badge>
              ))}
            </div>
            {certifications.length > 0 && (
              <div className="space-y-2">
                {certifications.map(cert => (
                  <div key={cert.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-background">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-sm">{cert.name}</span>
                    </div>
                    <button onClick={() => removeCertification(cert.id)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </FormSection>
        </div>
      )}

      {/* Availability */}
      {activeTab === 'availability' && (
        <div className="space-y-4">
          <FormSection title="Weekly Availability">
            <div className="space-y-2">
              {DAYS_OF_WEEK.map((day, idx) => (
                <div key={day} className="flex items-center gap-3 p-2.5 rounded-lg border bg-background">
                  <Switch checked={availability[idx]?.available} onCheckedChange={(checked) => setAvailability(prev => ({ ...prev, [idx]: { ...prev[idx], available: checked } }))} />
                  <span className="text-sm font-medium w-10">{day}</span>
                  {availability[idx]?.available && (
                    <div className="flex items-center gap-2 ml-auto">
                      <Input type="time" value={availability[idx].start} onChange={e => setAvailability(prev => ({ ...prev, [idx]: { ...prev[idx], start: e.target.value } }))} className="w-28 h-8 text-xs" />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input type="time" value={availability[idx].end} onChange={e => setAvailability(prev => ({ ...prev, [idx]: { ...prev[idx], end: e.target.value } }))} className="w-28 h-8 text-xs" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </FormSection>
          <FormSection title="Travel Preferences">
            <FormField label="Max Travel Distance (km)">
              <Input type="number" value={maxTravelDistance} onChange={e => setMaxTravelDistance(parseInt(e.target.value) || 25)} />
            </FormField>
          </FormSection>
        </div>
      )}

      {/* Documents */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <FormSection title="Required Documents">
            {['Resume', 'ID_Document', 'Police_Check', 'Working_Rights'].map(docType => {
              const uploaded = documents.find(d => d.type === docType);
              return (
                <div key={docType} className={cn('flex items-center justify-between p-3 rounded-lg border', uploaded && 'border-green-200 bg-green-50/50')}>
                  <div className="flex items-center gap-3">
                    <div className={cn('h-8 w-8 rounded-full flex items-center justify-center', uploaded ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground')}>
                      {uploaded ? <CheckCircle2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{docType.replace(/_/g, ' ')}</p>
                      {uploaded && <p className="text-xs text-muted-foreground">{uploaded.fileName}</p>}
                    </div>
                  </div>
                  <div>
                    <input type="file" id={`upload-cand-${docType}`} className="hidden" onChange={e => handleDocumentUpload(docType, e.target.files)} />
                    <Button variant={uploaded ? 'outlined' : 'contained'} size="small" onClick={() => document.getElementById(`upload-cand-${docType}`)?.click()}>
                      <Upload className="h-3.5 w-3.5 mr-1.5" />{uploaded ? 'Replace' : 'Upload'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </FormSection>
        </div>
      )}
    </PrimaryOffCanvas>
  );
};

export default CandidateOnboardingForm;
