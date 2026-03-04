import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Send,
  User,
  Briefcase,
  FileCheck,
  Upload,
  Info,
} from 'lucide-react';
import { departments, locations, mockAwardRules } from '@/data/mockStaffData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const roles = ['Support Worker', 'Team Leader', 'Room Leader', 'Centre Manager', 'Educator', 'Cook', 'Administrator'];
const accessRoles = [
  { id: 'HR', label: 'HR', description: 'Manage employee records and onboarding' },
  { id: 'Manager', label: 'Manager', description: 'Manage team members' },
  { id: 'Staff', label: 'Staff', description: 'Standard employee access' },
  { id: 'PayrollAdmin', label: 'Payroll Admin', description: 'Access payroll functions' },
  { id: 'LocationAdmin', label: 'Location Admin', description: 'Manage staff at assigned location' },
  { id: 'Admin', label: 'Admin', description: 'Full system access' },
];
const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
const employmentTypes = ['Full Time', 'Part Time', 'Casual', 'Contractor'];
const payRateTypes = ['No award', 'Hourly Rate', 'Annual Salary', 'Award Rate'];
const positions = ['Support Worker', 'Team Leader', 'Room Leader', 'Centre Manager', 'Educator', 'Cook', 'Administrator'];

const steps = [
  { id: 1, label: 'Employee Details', icon: User },
  { id: 2, label: 'Finalise Contracts', icon: Briefcase },
  { id: 3, label: 'Confirm & Onboard', icon: FileCheck },
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const mockAreas: Record<string, string[]> = {
  'Melbourne CBD': ['Toddler', 'Kindergarten', 'Nursery', 'Pre-School'],
  'South Yarra': ['Toddler', 'Kindergarten', 'Baby Room'],
  'Prahran': ['Pre-School', 'Toddler', 'After School'],
  'Richmond': ['Nursery', 'Toddler', 'Kindergarten'],
  'Fitzroy': ['Baby Room', 'Toddler', 'Pre-School'],
};

export default function PaperlessOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [sending, setSending] = useState(false);

  // Step 1 - Employee Details
  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    preferredName: '',
    email: '',
    mobilePhone: '',
    workPhone: '',
    gender: '',
    dateOfBirth: '',
    workLocations: [] as string[],
    workAreas: [] as string[],
    primaryLocation: '',
    selectedRoles: [] as string[],
    // Step 2
    employmentStartDate: '',
    contractedHours: '',
    position: '',
    payRateType: '',
    awardName: '',
    awardClassification: '',
    employmentType: '',
    hourlyRate: '',
    annualSalary: '',
    availabilityPattern: 'same_every_week' as 'same_every_week' | 'alternate',
    availability: days.map(d => ({ day: d, enabled: false, start: '', end: '', area: '' })),
    // Step 3
    personalMessage: '',
  });

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleRole = (role: string) => {
    setForm(prev => ({
      ...prev,
      selectedRoles: prev.selectedRoles.includes(role)
        ? prev.selectedRoles.filter(r => r !== role)
        : [...prev.selectedRoles, role],
    }));
  };

  const updateAvailability = (index: number, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      availability: prev.availability.map((a, i) => i === index ? { ...a, [field]: value } : a),
    }));
  };

  const canProceedStep1 = form.firstName && form.lastName && form.email.includes('@') && form.workLocations.length > 0;
  const canProceedStep2 = form.position && form.employmentType;

  const handleSend = async () => {
    setSending(true);
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    toast.success(`Onboarding invite sent to ${form.email}`);
    navigate('/workforce');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-border/50 bg-card">
          <div className="px-6 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <button onClick={() => navigate('/workforce')} className="hover:text-foreground transition-colors font-medium">Staff</button>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">Add Staff</span>
            </div>
          </div>
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-foreground">Add Staff</h1>
              <Button variant="outline" size="sm" onClick={() => navigate('/workforce')}>
                Onboarding History
              </Button>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-2">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (step.id < currentStep) setCurrentStep(step.id);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                    currentStep === step.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : step.id < currentStep
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {step.id < currentStep ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span className="h-5 w-5 rounded-full border-2 border-current flex items-center justify-center text-xs">{step.id}</span>
                  )}
                  {step.label}
                </button>
                {i < steps.length - 1 && (
                  <div className={cn("w-12 h-px", step.id < currentStep ? "bg-primary" : "bg-border")} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 max-w-4xl space-y-6">
          {/* ========== STEP 1 ========== */}
          {currentStep === 1 && (
            <>
              {/* Basic Information */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-1">Basic Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <FieldGroup label="First Name" required>
                    <Input value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="Enter your First Name" />
                  </FieldGroup>
                  <FieldGroup label="Middle Name/s">
                    <Input value={form.middleName} onChange={e => update('middleName', e.target.value)} placeholder="Enter your Middle Name" />
                  </FieldGroup>
                  <FieldGroup label="Last Name" required>
                    <Input value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Enter your Last Name" />
                  </FieldGroup>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <FieldGroup label="Preferred Name">
                    <Input value={form.preferredName} onChange={e => update('preferredName', e.target.value)} placeholder="Enter your Preferred Name" />
                  </FieldGroup>
                  <FieldGroup label="Email Address" required>
                    <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="Enter Your Email Address" />
                  </FieldGroup>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <FieldGroup label="Mobile Number" required>
                    <Input type="tel" value={form.mobilePhone} onChange={e => update('mobilePhone', e.target.value)} placeholder="+61" />
                  </FieldGroup>
                  <FieldGroup label="Work Number">
                    <Input type="tel" value={form.workPhone} onChange={e => update('workPhone', e.target.value)} placeholder="+61" />
                  </FieldGroup>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <FieldGroup label="Gender">
                    <Select value={form.gender} onValueChange={v => update('gender', v)}>
                      <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                      <SelectContent>
                        {genderOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FieldGroup>
                  <FieldGroup label="Date of Birth">
                    <Input type="date" value={form.dateOfBirth} onChange={e => update('dateOfBirth', e.target.value)} />
                  </FieldGroup>
                </div>
              </section>

              <hr className="border-border/50" />

              {/* Work Locations & Areas */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-1">Work Locations</h2>
                <div className="space-y-4 mt-4">
                  {/* Work Locations Multi-select */}
                  <FieldGroup label="Work Locations" required>
                    <div className="space-y-2">
                      {form.workLocations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {form.workLocations.map(loc => (
                            <Badge key={loc} variant="secondary" className="text-xs gap-1 pr-1">
                              {loc}
                              <button
                                onClick={() => {
                                  const updated = form.workLocations.filter(l => l !== loc);
                                  update('workLocations', updated);
                                  if (form.primaryLocation === loc) update('primaryLocation', updated[0] || '');
                                  // Remove areas belonging to removed location
                                  const remainingAreas = form.workAreas.filter(a => 
                                    updated.some(l => mockAreas[l]?.includes(a))
                                  );
                                  update('workAreas', remainingAreas);
                                }}
                                className="ml-0.5 h-4 w-4 rounded-full hover:bg-destructive/20 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <Select
                        value=""
                        onValueChange={v => {
                          if (!form.workLocations.includes(v)) {
                            const updated = [...form.workLocations, v];
                            update('workLocations', updated);
                            if (updated.length === 1) update('primaryLocation', v);
                          }
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Add location..." /></SelectTrigger>
                        <SelectContent>
                          {locations.filter(l => !form.workLocations.includes(l)).map(l => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </FieldGroup>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Primary Work Location */}
                    <FieldGroup label="Primary Work Location" required>
                      <Select
                        value={form.primaryLocation}
                        onValueChange={v => update('primaryLocation', v)}
                        disabled={form.workLocations.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={form.workLocations.length === 0 ? "Add work locations first" : "Select primary location"} />
                        </SelectTrigger>
                        <SelectContent>
                          {form.workLocations.map(l => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldGroup>

                    {/* Work Areas Multi-select */}
                    <FieldGroup label="Work Areas">
                      <div className="space-y-2">
                        {form.workAreas.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {form.workAreas.map(area => (
                              <Badge key={area} variant="outline" className="text-xs gap-1 pr-1">
                                {area}
                                <button
                                  onClick={() => update('workAreas', form.workAreas.filter(a => a !== area))}
                                  className="ml-0.5 h-4 w-4 rounded-full hover:bg-destructive/20 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        <Select
                          value=""
                          onValueChange={v => {
                            if (!form.workAreas.includes(v)) {
                              update('workAreas', [...form.workAreas, v]);
                            }
                          }}
                          disabled={form.workLocations.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={form.workLocations.length === 0 ? "Add locations first" : "Add area..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Grouped by location */}
                            {form.workLocations.map(loc => {
                              const areas = (mockAreas[loc] || []).filter(a => !form.workAreas.includes(a));
                              if (areas.length === 0) return null;
                              return (
                                <div key={loc}>
                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{loc}</div>
                                  {areas.map(a => (
                                    <SelectItem key={`${loc}-${a}`} value={a}>{a}</SelectItem>
                                  ))}
                                </div>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </FieldGroup>
                  </div>
                </div>
              </section>

              <hr className="border-border/50" />

              {/* Role Assignment */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-1">Role Assignment & Access Rights</h2>
                <p className="text-sm text-muted-foreground mb-3">You can select more than one</p>
                <div className="space-y-1">
                  {accessRoles.map(role => (
                    <label
                      key={role.id}
                      className={cn(
                        "flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-colors",
                        form.selectedRoles.includes(role.id)
                          ? "border-primary/40 bg-primary/5"
                          : "border-transparent hover:bg-muted/40"
                      )}
                    >
                      <Checkbox
                        checked={form.selectedRoles.includes(role.id)}
                        onCheckedChange={() => toggleRole(role.id)}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="text-sm font-medium text-foreground">{role.label}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              {/* Navigation */}
              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <Button variant="outline" className="min-w-[120px]" onClick={() => navigate('/workforce')}>
                  Back
                </Button>
                <Button
                  className="min-w-[140px]"
                  disabled={!canProceedStep1}
                  onClick={() => setCurrentStep(2)}
                >
                  Save & Next
                </Button>
              </div>
            </>
          )}

          {/* ========== STEP 2 ========== */}
          {currentStep === 2 && (
            <>
              {/* Employment Information */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-1">Employment Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <FieldGroup label="Employment Start Date">
                    <Input type="date" value={form.employmentStartDate} onChange={e => update('employmentStartDate', e.target.value)} placeholder="Employment start date" />
                  </FieldGroup>
                  <FieldGroup label="Contracted Weekly Hours">
                    <Input type="number" value={form.contractedHours} onChange={e => update('contractedHours', e.target.value)} placeholder="0.0" />
                  </FieldGroup>
                </div>
                <div className="mt-4">
                  <FieldGroup label="Position" required>
                    <Select value={form.position} onValueChange={v => update('position', v)}>
                      <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                      <SelectContent>
                        {positions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FieldGroup>
                </div>
              </section>

              <hr className="border-border/50" />

              {/* Pay Details */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-1">Pay Details</h2>
                <div className="mt-4">
                  <FieldGroup label="Payrate Type">
                    <Select value={form.payRateType} onValueChange={v => {
                      update('payRateType', v);
                      if (v !== 'Award Rate') {
                        update('awardName', '');
                        update('awardClassification', '');
                      }
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select pay rate type" /></SelectTrigger>
                      <SelectContent>
                        {payRateTypes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FieldGroup>
                </div>

                {/* Award Rate Fields */}
                {form.payRateType === 'Award Rate' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <FieldGroup label="Award" required>
                        <Select value={form.awardName} onValueChange={v => {
                          update('awardName', v);
                          update('awardClassification', '');
                        }}>
                          <SelectTrigger><SelectValue placeholder="Select award" /></SelectTrigger>
                          <SelectContent>
                            {[...new Set(mockAwardRules.map(a => a.awardName))].map(name => (
                              <SelectItem key={name} value={name}>{name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldGroup>
                      <FieldGroup label="Classification" required>
                        <Select value={form.awardClassification} onValueChange={v => update('awardClassification', v)} disabled={!form.awardName}>
                          <SelectTrigger><SelectValue placeholder={form.awardName ? "Select classification" : "Select award first"} /></SelectTrigger>
                          <SelectContent>
                            {mockAwardRules
                              .filter(a => a.awardName === form.awardName)
                              .map(a => (
                                <SelectItem key={a.id} value={a.id}>{a.classification} — {a.level}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </FieldGroup>
                    </div>

                    {/* Applicable Pay Rates Preview */}
                    {form.awardClassification && (() => {
                      const award = mockAwardRules.find(a => a.id === form.awardClassification);
                      if (!award) return null;
                      return (
                        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                          <h4 className="text-sm font-semibold text-foreground mb-2">Applicable Pay Rates</h4>
                          <p className="text-xs text-muted-foreground mb-3">{award.awardName} — {award.classification} ({award.level})</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <RateItem label="Base Hourly Rate" value={`$${award.baseHourlyRate.toFixed(2)}/hour`} />
                            {award.casualLoading && <RateItem label="Casual Loading" value={`${award.casualLoading}%`} />}
                            {award.saturdayRate && <RateItem label="Saturday" value={`${award.saturdayRate}%`} />}
                            {award.sundayRate && <RateItem label="Sunday" value={`${award.sundayRate}%`} />}
                            {award.publicHolidayRate && <RateItem label="Public Holiday" value={`${award.publicHolidayRate}%`} />}
                            <RateItem label="OT (first 2hrs)" value={`${award.overtimeRates.first2Hours}%`} />
                            <RateItem label="OT (after 2hrs)" value={`${award.overtimeRates.after2Hours}%`} />
                            {award.penaltyRates?.evening && <RateItem label="Evening Penalty" value={`${award.penaltyRates.evening}%`} />}
                            {award.penaltyRates?.night && <RateItem label="Night Penalty" value={`${award.penaltyRates.night}%`} />}
                          </div>
                          {award.allowances.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-primary/10">
                              <p className="text-xs font-medium text-muted-foreground mb-1.5">Allowances</p>
                              <div className="flex flex-wrap gap-2">
                                {award.allowances.map(a => (
                                  <Badge key={a.id} variant="outline" className="text-xs">
                                    {a.name}: ${a.amount.toFixed(2)}/{a.type.replace('per_', '')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <FieldGroup label="Employment Type" required>
                    <Select value={form.employmentType} onValueChange={v => update('employmentType', v)}>
                      <SelectTrigger><SelectValue placeholder="Select employment type" /></SelectTrigger>
                      <SelectContent>
                        {employmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FieldGroup>
                  {form.payRateType !== 'Award Rate' && (
                    <FieldGroup label="Hourly Rate">
                      <Input type="number" value={form.hourlyRate} onChange={e => update('hourlyRate', e.target.value)} placeholder="Enter Your Hourly Rate" />
                    </FieldGroup>
                  )}
                </div>
                {form.payRateType === 'Annual Salary' && (
                  <div className="mt-4 max-w-sm">
                    <FieldGroup label="Annual Salary">
                      <Input type="number" value={form.annualSalary} onChange={e => update('annualSalary', e.target.value)} placeholder="Enter annual salary" />
                    </FieldGroup>
                  </div>
                )}
              </section>

              <hr className="border-border/50" />

              {/* Weekly Availability */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-1">Weekly Availability Settings</h2>
                <div className="mt-4 space-y-3">
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-border/60 cursor-pointer hover:bg-muted/30 transition-colors">
                    <input
                      type="radio"
                      name="availability"
                      checked={form.availabilityPattern === 'same_every_week'}
                      onChange={() => update('availabilityPattern', 'same_every_week')}
                      className="mt-0.5 accent-[hsl(var(--primary))]"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">Same Every Week</p>
                      <p className="text-xs text-muted-foreground">Fixed weekly availability that remains constant.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-border/60 cursor-pointer hover:bg-muted/30 transition-colors">
                    <input
                      type="radio"
                      name="availability"
                      checked={form.availabilityPattern === 'alternate'}
                      onChange={() => update('availabilityPattern', 'alternate')}
                      className="mt-0.5 accent-[hsl(var(--primary))]"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">Alternate Weekly (Week A / Week B)</p>
                      <p className="text-xs text-muted-foreground">A bi-weekly rotation with two different schedules.</p>
                    </div>
                  </label>
                </div>

                {/* Availability Table */}
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Same Every Week</h3>
                  <div className="border border-border/60 rounded-lg overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-[160px_1fr_1fr_80px_80px_180px] gap-2 px-4 py-2.5 bg-muted/50 text-xs font-medium text-muted-foreground border-b border-border/40">
                      <span>Day</span>
                      <span>Start</span>
                      <span>Finish</span>
                      <span>Hours</span>
                      <span>Breaks</span>
                      <span>Location / Area</span>
                    </div>
                    {form.availability.map((day, i) => {
                      // Build location/area options from selected work locations + areas
                      const locationAreaOptions: { value: string; label: string; group?: string }[] = [];
                      form.workLocations.forEach(loc => {
                        locationAreaOptions.push({ value: loc, label: loc });
                        const areas = (mockAreas[loc] || []).filter(a => form.workAreas.includes(a));
                        areas.forEach(a => locationAreaOptions.push({ value: `${loc} › ${a}`, label: `${loc} › ${a}`, group: loc }));
                      });

                      return (
                        <div key={day.day} className={cn(
                          "grid grid-cols-[160px_1fr_1fr_80px_80px_180px] gap-2 px-4 py-3 items-center",
                          i < form.availability.length - 1 && "border-b border-border/30"
                        )}>
                          <div>
                            <p className="text-sm font-medium text-foreground">{day.day}</p>
                          </div>
                          <Input
                            type="time"
                            value={day.start}
                            onChange={e => updateAvailability(i, 'start', e.target.value)}
                            className="h-8 text-xs"
                            placeholder="--:--"
                          />
                          <Input
                            type="time"
                            value={day.end}
                            onChange={e => updateAvailability(i, 'end', e.target.value)}
                            className="h-8 text-xs"
                            placeholder="--:--"
                          />
                          <span className="text-xs text-muted-foreground text-center">0h</span>
                          <span className="text-xs text-muted-foreground text-center">0 min</span>
                          <Select value={day.area} onValueChange={v => updateAvailability(i, 'area', v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                            <SelectContent>
                              {locationAreaOptions.length > 0 ? (
                                locationAreaOptions.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))
                              ) : (
                                locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              <hr className="border-border/50" />

              {/* Employment Contract & Documents */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-1">Employment Contract & Documents</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <FieldGroup label="Select & Send Employment Contracts">
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select Contracts" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Employment Contract</SelectItem>
                        <SelectItem value="casual">Casual Employment Contract</SelectItem>
                        <SelectItem value="fixed">Fixed Term Contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldGroup>
                  <FieldGroup label="Select Documents">
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select Documents" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="policy">Company Policy</SelectItem>
                        <SelectItem value="handbook">Employee Handbook</SelectItem>
                        <SelectItem value="nda">NDA</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldGroup>
                </div>

                <div className="mt-4">
                  <Label className="text-sm text-muted-foreground mb-1.5 block">Additional Documents Required</Label>
                  <div className="border-2 border-dashed border-border/60 rounded-lg p-8 text-center hover:border-primary/40 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-foreground font-medium">Select a file or drag and drop here</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG or PDF, file size no more than 10MB</p>
                    <Button variant="outline" size="sm" className="mt-3">Select File</Button>
                  </div>
                </div>
              </section>

              {/* Navigation */}
              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <Button variant="outline" className="min-w-[120px]" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button
                  className="min-w-[140px]"
                  disabled={!canProceedStep2}
                  onClick={() => setCurrentStep(3)}
                >
                  Save & Next
                </Button>
              </div>
            </>
          )}

          {/* ========== STEP 3 ========== */}
          {currentStep === 3 && (
            <>
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Review & Confirm</h2>

                {/* Summary Cards */}
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-5">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Employee Details</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6 text-sm">
                        <SummaryItem label="Name" value={`${form.firstName} ${form.middleName} ${form.lastName}`.trim()} />
                        {form.preferredName && <SummaryItem label="Preferred Name" value={form.preferredName} />}
                        <SummaryItem label="Email" value={form.email} />
                        <SummaryItem label="Mobile" value={form.mobilePhone || '—'} />
                        {form.workPhone && <SummaryItem label="Work Phone" value={form.workPhone} />}
                        {form.gender && <SummaryItem label="Gender" value={form.gender} />}
                        {form.dateOfBirth && <SummaryItem label="Date of Birth" value={form.dateOfBirth} />}
                        <SummaryItem label="Work Locations" value={form.workLocations.join(', ') || '—'} />
                        {form.primaryLocation && <SummaryItem label="Primary Location" value={form.primaryLocation} />}
                      </div>
                      {form.selectedRoles.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/40">
                          <span className="text-xs text-muted-foreground">Roles: </span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {form.selectedRoles.map(r => (
                              <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-5">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Employment & Pay</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6 text-sm">
                        <SummaryItem label="Position" value={form.position} />
                        <SummaryItem label="Employment Type" value={form.employmentType} />
                        {form.employmentStartDate && <SummaryItem label="Start Date" value={form.employmentStartDate} />}
                        {form.contractedHours && <SummaryItem label="Contracted Hours" value={`${form.contractedHours}h/week`} />}
                        {form.payRateType && <SummaryItem label="Pay Rate Type" value={form.payRateType} />}
                        {form.payRateType === 'Award Rate' && form.awardClassification && (() => {
                          const award = mockAwardRules.find(a => a.id === form.awardClassification);
                          return award ? (
                            <>
                              <SummaryItem label="Award" value={award.awardName} />
                              <SummaryItem label="Classification" value={`${award.classification} — ${award.level}`} />
                              <SummaryItem label="Base Rate" value={`$${award.baseHourlyRate.toFixed(2)}/hr`} />
                            </>
                          ) : null;
                        })()}
                        {form.hourlyRate && <SummaryItem label="Hourly Rate" value={`$${form.hourlyRate}`} />}
                        {form.annualSalary && <SummaryItem label="Annual Salary" value={`$${Number(form.annualSalary).toLocaleString()}`} />}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Availability summary */}
                  {form.availability.some(a => a.start && a.end) && (
                    <Card>
                      <CardContent className="p-5">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Weekly Availability</h3>
                        <div className="space-y-1.5">
                          {form.availability.filter(a => a.start && a.end).map(a => (
                            <div key={a.day} className="flex items-center gap-4 text-sm">
                              <span className="font-medium text-foreground w-24">{a.day}</span>
                              <span className="text-muted-foreground">{a.start} – {a.end}</span>
                              {a.area && <Badge variant="outline" className="text-xs">{a.area}</Badge>}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </section>

              <hr className="border-border/50" />

              {/* Onboarding invite message */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-1">Onboarding Invite</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  A digital onboarding link will be sent to <span className="font-medium text-foreground">{form.email}</span>. 
                  The employee will complete any remaining details, upload documents, and accept policies.
                </p>
                <FieldGroup label="Personal Message (optional)">
                  <Textarea
                    value={form.personalMessage}
                    onChange={e => update('personalMessage', e.target.value)}
                    placeholder="Add a welcome message to include in the onboarding email..."
                    rows={3}
                    className="resize-none"
                  />
                </FieldGroup>

                {/* What they'll complete */}
                <div className="rounded-xl bg-muted/40 p-4 mt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">The employee will also complete:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['Emergency contacts', 'Bank & super details', 'Tax file declaration', 'Upload ID documents', 'Review & accept policies', 'Sign employment contract'].map(item => (
                      <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Navigation */}
              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <Button variant="outline" className="min-w-[120px]" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button className="min-w-[180px]" onClick={handleSend} disabled={sending}>
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Sending Invite...' : 'Create Employee'}
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// Reusable field wrapper
function FieldGroup({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm text-muted-foreground mb-1.5 flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
        <Info className="h-3 w-3 text-muted-foreground/50" />
      </Label>
      {children}
    </div>
  );
}

// Summary item
function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value || '—'}</p>
    </div>
  );
}

// Rate display item
function RateItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}
