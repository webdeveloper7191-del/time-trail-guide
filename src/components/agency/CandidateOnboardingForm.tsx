import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/mui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  User, FileText, Briefcase, Calendar as CalendarIcon, 
  Upload, Plus, X, CheckCircle2, AlertCircle, Loader2,
  Clock, MapPin, Star, Shield
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

  // Personal Details
  const [personalDetails, setPersonalDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: undefined as Date | undefined,
    address: {
      street: '',
      suburb: '',
      state: '',
      postcode: '',
    },
    taxFileNumber: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
  });

  // Employment
  const [employmentType, setEmploymentType] = useState<string>('casual');
  const [primaryRole, setPrimaryRole] = useState<string>('');
  const [secondaryRoles, setSecondaryRoles] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState<number>(0);
  const [payRate, setPayRate] = useState<number>(0);
  const [awardClassification, setAwardClassification] = useState<string>('');

  // Skills & Certifications
  const [selectedSkills, setSelectedSkills] = useState<CandidateSkill[]>([]);
  const [certifications, setCertifications] = useState<CandidateCertification[]>([]);

  // Availability
  const [availability, setAvailability] = useState<{
    [key: number]: { available: boolean; start: string; end: string };
  }>({
    0: { available: false, start: '08:00', end: '18:00' },
    1: { available: true, start: '08:00', end: '18:00' },
    2: { available: true, start: '08:00', end: '18:00' },
    3: { available: true, start: '08:00', end: '18:00' },
    4: { available: true, start: '08:00', end: '18:00' },
    5: { available: true, start: '08:00', end: '18:00' },
    6: { available: false, start: '08:00', end: '18:00' },
  });
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [maxTravelDistance, setMaxTravelDistance] = useState<number>(25);

  // Documents
  const [documents, setDocuments] = useState<{ type: string; name: string; fileName: string }[]>([]);

  const toggleSkill = (skillName: string) => {
    setSelectedSkills(prev => {
      const exists = prev.find(s => s.name === skillName);
      if (exists) {
        return prev.filter(s => s.name !== skillName);
      }
      return [...prev, {
        id: `skill-${Date.now()}`,
        name: skillName,
        level: 'intermediate' as const,
        yearsExperience: 1,
      }];
    });
  };

  const addCertification = (certName: string) => {
    if (certifications.find(c => c.name === certName)) return;
    
    setCertifications(prev => [...prev, {
      id: `cert-${Date.now()}`,
      name: certName,
      issuer: '',
      issueDate: new Date().toISOString().split('T')[0],
      status: 'valid' as const,
    }]);
  };

  const removeCertification = (id: string) => {
    setCertifications(prev => prev.filter(c => c.id !== id));
  };

  const handleDocumentUpload = (type: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setDocuments(prev => [...prev.filter(d => d.type !== type), {
      type,
      name: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      fileName: file.name,
    }]);
    toast.success(`${type} uploaded`);
  };

  const getCompletionPercentage = () => {
    let total = 0;
    let completed = 0;

    // Personal (30%)
    total += 30;
    if (personalDetails.firstName && personalDetails.lastName && personalDetails.email && personalDetails.phone) {
      completed += 30;
    } else if (personalDetails.firstName || personalDetails.lastName) {
      completed += 15;
    }

    // Employment (25%)
    total += 25;
    if (primaryRole && employmentType) {
      completed += 25;
    } else if (primaryRole || employmentType) {
      completed += 12;
    }

    // Skills (20%)
    total += 20;
    if (selectedSkills.length >= 3) {
      completed += 20;
    } else if (selectedSkills.length > 0) {
      completed += 10;
    }

    // Certifications (15%)
    total += 15;
    if (certifications.length >= 2) {
      completed += 15;
    } else if (certifications.length > 0) {
      completed += 7;
    }

    // Availability (10%)
    total += 10;
    if (Object.values(availability).some(a => a.available)) {
      completed += 10;
    }

    return Math.round((completed / total) * 100);
  };

  const handleSubmit = async () => {
    if (!personalDetails.firstName || !personalDetails.lastName || !personalDetails.email || !primaryRole) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const candidate: Partial<Candidate> = {
      firstName: personalDetails.firstName,
      lastName: personalDetails.lastName,
      email: personalDetails.email,
      phone: personalDetails.phone,
      employmentType: employmentType as Candidate['employmentType'],
      status: 'available',
      primaryRole,
      secondaryRoles,
      skills: selectedSkills,
      certifications,
      yearsExperience,
      awardClassification,
      payRate,
      availability: Object.entries(availability).map(([day, data]) => ({
        dayOfWeek: parseInt(day),
        startTime: data.start,
        endTime: data.end,
        isAvailable: data.available,
      })),
      preferredLocations,
      maxTravelDistance,
      complianceScore: certifications.length >= 2 ? 100 : certifications.length === 1 ? 75 : 50,
      reliabilityScore: 100,
      averageRating: 0,
      totalShiftsCompleted: 0,
      noShowCount: 0,
      hoursWorkedThisWeek: 0,
    };

    onComplete(candidate);
    setIsSaving(false);
    toast.success('Candidate registered successfully!');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Register New Candidate</span>
            <div className="flex items-center gap-2 text-sm font-normal">
              <Progress value={getCompletionPercentage()} className="w-24 h-2" />
              <span className="text-muted-foreground">{getCompletionPercentage()}%</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Personal</span>
            </TabsTrigger>
            <TabsTrigger value="employment" className="gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Employment</span>
            </TabsTrigger>
            <TabsTrigger value="skills" className="gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Skills</span>
            </TabsTrigger>
            <TabsTrigger value="availability" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Availability</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto py-4">
            {/* Personal Details Tab */}
            <TabsContent value="personal" className="space-y-6 mt-0">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={personalDetails.firstName}
                    onChange={e => setPersonalDetails(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={personalDetails.lastName}
                    onChange={e => setPersonalDetails(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={personalDetails.email}
                    onChange={e => setPersonalDetails(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={personalDetails.phone}
                    onChange={e => setPersonalDetails(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outlined" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {personalDetails.dateOfBirth ? format(personalDetails.dateOfBirth, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={personalDetails.dateOfBirth}
                        onSelect={(date) => setPersonalDetails(prev => ({ ...prev, dateOfBirth: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tfn">Tax File Number</Label>
                  <Input
                    id="tfn"
                    value={personalDetails.taxFileNumber}
                    onChange={e => setPersonalDetails(prev => ({ ...prev, taxFileNumber: e.target.value }))}
                    placeholder="XXX XXX XXX"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Address</h4>
                <div className="grid gap-4">
                  <Input
                    placeholder="Street Address"
                    value={personalDetails.address.street}
                    onChange={e => setPersonalDetails(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, street: e.target.value }
                    }))}
                  />
                  <div className="grid gap-4 md:grid-cols-3">
                    <Input
                      placeholder="Suburb"
                      value={personalDetails.address.suburb}
                      onChange={e => setPersonalDetails(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, suburb: e.target.value }
                      }))}
                    />
                    <Input
                      placeholder="State"
                      value={personalDetails.address.state}
                      onChange={e => setPersonalDetails(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, state: e.target.value }
                      }))}
                    />
                    <Input
                      placeholder="Postcode"
                      value={personalDetails.address.postcode}
                      onChange={e => setPersonalDetails(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, postcode: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Emergency Contact</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <Input
                    placeholder="Full Name"
                    value={personalDetails.emergencyContact.name}
                    onChange={e => setPersonalDetails(prev => ({ 
                      ...prev, 
                      emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                    }))}
                  />
                  <Input
                    placeholder="Phone"
                    value={personalDetails.emergencyContact.phone}
                    onChange={e => setPersonalDetails(prev => ({ 
                      ...prev, 
                      emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                    }))}
                  />
                  <Input
                    placeholder="Relationship"
                    value={personalDetails.emergencyContact.relationship}
                    onChange={e => setPersonalDetails(prev => ({ 
                      ...prev, 
                      emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Employment Tab */}
            <TabsContent value="employment" className="space-y-6 mt-0">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Employment Type *</Label>
                  <Select value={employmentType} onValueChange={setEmploymentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Years of Experience</Label>
                  <Input
                    type="number"
                    min="0"
                    value={yearsExperience}
                    onChange={e => setYearsExperience(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Primary Role *</Label>
                <Select value={primaryRole} onValueChange={setPrimaryRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Secondary Roles</Label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.filter(r => r !== primaryRole).map(role => (
                    <Badge
                      key={role}
                      variant={secondaryRoles.includes(role) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        setSecondaryRoles(prev => 
                          prev.includes(role) 
                            ? prev.filter(r => r !== role)
                            : [...prev, role]
                        );
                      }}
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Award Classification</Label>
                  <Input
                    value={awardClassification}
                    onChange={e => setAwardClassification(e.target.value)}
                    placeholder="e.g., RN Level 2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Desired Pay Rate ($/hr)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.50"
                    value={payRate || ''}
                    onChange={e => setPayRate(parseFloat(e.target.value) || 0)}
                    placeholder="45.00"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills" className="space-y-6 mt-0">
              <div>
                <Label className="mb-3 block">Skills (select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.map(skill => (
                    <Badge
                      key={skill}
                      variant={selectedSkills.find(s => s.name === skill) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="mb-3 block">Certifications</Label>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {CERTIFICATIONS.map(cert => (
                      <Badge
                        key={cert.name}
                        variant={certifications.find(c => c.name === cert.name) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => addCertification(cert.name)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {cert.name}
                      </Badge>
                    ))}
                  </div>

                  {certifications.length > 0 && (
                    <div className="space-y-2">
                      {certifications.map(cert => (
                        <Card key={cert.id}>
                          <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-primary" />
                              <span className="font-medium">{cert.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                className="w-32 h-8"
                                type="date"
                                value={cert.issueDate}
                                onChange={e => {
                                  setCertifications(prev => prev.map(c => 
                                    c.id === cert.id ? { ...c, issueDate: e.target.value } : c
                                  ));
                                }}
                              />
                              <Button variant="ghost" size="small" onClick={() => removeCertification(cert.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Availability Tab */}
            <TabsContent value="availability" className="space-y-6 mt-0">
              <div>
                <Label className="mb-3 block">Weekly Availability</Label>
                <div className="space-y-2">
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <Card key={idx} className={cn(!availability[idx].available && 'opacity-50')}>
                      <CardContent className="p-3 flex items-center gap-4">
                        <Checkbox
                          checked={availability[idx].available}
                          onCheckedChange={(checked) => {
                            setAvailability(prev => ({
                              ...prev,
                              [idx]: { ...prev[idx], available: !!checked }
                            }));
                          }}
                        />
                        <span className="w-12 font-medium">{day}</span>
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="time"
                            className="w-28"
                            value={availability[idx].start}
                            onChange={e => setAvailability(prev => ({
                              ...prev,
                              [idx]: { ...prev[idx], start: e.target.value }
                            }))}
                            disabled={!availability[idx].available}
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input
                            type="time"
                            className="w-28"
                            value={availability[idx].end}
                            onChange={e => setAvailability(prev => ({
                              ...prev,
                              [idx]: { ...prev[idx], end: e.target.value }
                            }))}
                            disabled={!availability[idx].available}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Preferred Locations</Label>
                  <Textarea
                    placeholder="e.g., Sydney CBD, Inner West, North Shore"
                    value={preferredLocations.join(', ')}
                    onChange={e => setPreferredLocations(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum Travel Distance (km)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={maxTravelDistance}
                    onChange={e => setMaxTravelDistance(parseInt(e.target.value) || 25)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4 mt-0">
              <p className="text-sm text-muted-foreground">
                Upload required identification and compliance documents.
              </p>

              {[
                { type: 'photo_id', label: 'Photo ID (Passport or Drivers Licence)' },
                { type: 'visa', label: 'Visa / Work Rights (if applicable)' },
                { type: 'resume', label: 'Resume / CV' },
                { type: 'references', label: 'Reference Letters' },
              ].map(doc => {
                const uploaded = documents.find(d => d.type === doc.type);
                
                return (
                  <Card key={doc.type} className={cn(
                    uploaded && 'border-green-200 bg-green-50 dark:bg-green-950/20'
                  )}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center",
                          uploaded ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
                        )}>
                          {uploaded ? <CheckCircle2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium">{doc.label}</p>
                          {uploaded && <p className="text-sm text-muted-foreground">{uploaded.fileName}</p>}
                        </div>
                      </div>
                      <div>
                        <input
                          type="file"
                          id={`upload-${doc.type}`}
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
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
                    </CardContent>
                  </Card>
                );
              })}

              {/* Certification Documents */}
              {certifications.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Certification Documents</h4>
                  {certifications.map(cert => {
                    const uploaded = documents.find(d => d.type === `cert-${cert.id}`);
                    
                    return (
                      <Card key={cert.id} className={cn(
                        "mb-2",
                        uploaded && 'border-green-200 bg-green-50 dark:bg-green-950/20'
                      )}>
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className={cn("h-4 w-4", uploaded ? 'text-green-600' : 'text-muted-foreground')} />
                            <span>{cert.name}</span>
                          </div>
                          <div>
                            <input
                              type="file"
                              id={`upload-cert-${cert.id}`}
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={e => handleDocumentUpload(`cert-${cert.id}`, e.target.files)}
                            />
                            <Button
                              variant="ghost"
                              size="small"
                              onClick={() => document.getElementById(`upload-cert-${cert.id}`)?.click()}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-between border-t pt-4">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Register Candidate'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CandidateOnboardingForm;
