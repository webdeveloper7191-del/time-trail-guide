import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronRight, Eye, EyeOff, Copy, RefreshCw, CheckCircle2, ArrowLeft, Shield, Info } from 'lucide-react';
import { departments, locations, mockAwardRules } from '@/data/mockStaffData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const positions = ['Support Worker', 'Team Leader', 'Room Leader', 'Centre Manager', 'Educator', 'Cook', 'Administrator'];
const employmentTypes = ['Full Time', 'Part Time', 'Casual', 'Contractor'];
const payRateTypes = ['No award', 'Hourly Rate', 'Annual Salary', 'Award Rate'];
const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];

const accessRoles = [
  { id: 'HR', label: 'HR', description: 'Manage employee records and onboarding' },
  { id: 'Manager', label: 'Manager', description: 'Manage team members' },
  { id: 'Staff', label: 'Staff', description: 'Standard employee access' },
  { id: 'PayrollAdmin', label: 'Payroll Admin', description: 'Access payroll functions' },
  { id: 'LocationAdmin', label: 'Location Admin', description: 'Manage staff at assigned location' },
  { id: 'Admin', label: 'Admin', description: 'Full system access' },
];

const mockAreas: Record<string, string[]> = {
  'Melbourne CBD': ['Toddler', 'Kindergarten', 'Nursery', 'Pre-School'],
  'South Yarra': ['Toddler', 'Kindergarten', 'Baby Room'],
  'Prahran': ['Pre-School', 'Toddler', 'After School'],
  'Richmond': ['Nursery', 'Toddler', 'Kindergarten'],
  'Fitzroy': ['Baby Room', 'Toddler', 'Pre-School'],
};

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const specials = '!@#$%&*';
  let pwd = '';
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  pwd += specials[Math.floor(Math.random() * specials.length)];
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

function generateEmployeeId(): string {
  return `EMP-${String(Math.floor(1000 + Math.random() * 9000))}`;
}

export default function AddStaffManual() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    // Personal
    firstName: '',
    middleName: '',
    lastName: '',
    preferredName: '',
    email: '',
    mobilePhone: '',
    workPhone: '',
    gender: '',
    dateOfBirth: '',
    // Employment
    employeeId: generateEmployeeId(),
    position: '',
    department: '',
    employmentType: '',
    employmentStartDate: '',
    // Pay
    payRateType: '',
    awardName: '',
    awardClassification: '',
    overrideEnabled: false,
    overrideHourlyRate: '',
    overrideSaturdayRate: '',
    overrideSundayRate: '',
    overridePublicHolidayRate: '',
    overrideOt1: '',
    overrideOt2: '',
    hourlyRate: '',
    annualSalary: '',
    // Locations & Areas
    workLocations: [] as string[],
    primaryLocation: '',
    // Access Roles
    selectedRoles: ['Staff'] as string[],
    // Credentials
    password: generatePassword(),
  });

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleRole = (roleId: string) => {
    setForm(prev => ({
      ...prev,
      selectedRoles: prev.selectedRoles.includes(roleId)
        ? prev.selectedRoles.filter(r => r !== roleId)
        : [...prev.selectedRoles, roleId],
    }));
  };

  const isValid = form.firstName && form.lastName && form.email.includes('@') && form.position && form.workLocations.length > 0 && form.employmentType;

  const selectedAward = useMemo(() => {
    if (form.payRateType !== 'Award Rate' || !form.awardClassification) return null;
    return mockAwardRules.find(a => a.id === form.awardClassification) || null;
  }, [form.payRateType, form.awardClassification]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    setSaving(false);
    toast.success(`${form.firstName} ${form.lastName} has been added and login credentials issued`);
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
              <button onClick={() => navigate('/workforce')} className="hover:text-foreground transition-colors font-medium">
                Staff
              </button>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">Add Manually</span>
            </div>
          </div>
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Add Staff Manually</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a staff profile directly. Onboarding is skipped and login credentials are issued immediately.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => navigate('/workforce')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!isValid || saving}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {saving ? 'Creating...' : 'Create & Issue Login'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-4xl space-y-6">
          {/* ===== Personal Details ===== */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Details</CardTitle>
              <CardDescription>Basic information about the new staff member</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FG label="First Name" required>
                  <Input value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="Enter first name" />
                </FG>
                <FG label="Middle Name">
                  <Input value={form.middleName} onChange={e => update('middleName', e.target.value)} placeholder="Enter middle name" />
                </FG>
                <FG label="Last Name" required>
                  <Input value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Enter last name" />
                </FG>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FG label="Preferred Name">
                  <Input value={form.preferredName} onChange={e => update('preferredName', e.target.value)} placeholder="Enter preferred name" />
                </FG>
                <FG label="Email Address" required>
                  <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="john@example.com" />
                </FG>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FG label="Mobile Phone">
                  <Input type="tel" value={form.mobilePhone} onChange={e => update('mobilePhone', e.target.value)} placeholder="+61" />
                </FG>
                <FG label="Work Phone">
                  <Input type="tel" value={form.workPhone} onChange={e => update('workPhone', e.target.value)} placeholder="+61" />
                </FG>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FG label="Gender">
                  <Select value={form.gender} onValueChange={v => update('gender', v)}>
                    <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                    <SelectContent>
                      {genderOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FG>
                <FG label="Date of Birth">
                  <Input type="date" value={form.dateOfBirth} onChange={e => update('dateOfBirth', e.target.value)} />
                </FG>
              </div>
            </CardContent>
          </Card>

          {/* ===== Work Locations & Areas ===== */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Work Locations & Areas</CardTitle>
              <CardDescription>Assign one or more locations and areas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FG label="Work Locations / Areas" required>
                <div className="space-y-2">
                  {form.workLocations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {form.workLocations.map(item => (
                        <Badge key={item} variant="secondary" className="text-xs gap-1 pr-1">
                          {item}
                          <button
                            onClick={() => {
                              const updated = form.workLocations.filter(l => l !== item);
                              update('workLocations', updated);
                              if (form.primaryLocation === item) update('primaryLocation', updated[0] || '');
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
                    <SelectTrigger><SelectValue placeholder="Add location or area..." /></SelectTrigger>
                    <SelectContent>
                      {locations.map(loc => {
                        const areas = mockAreas[loc] || [];
                        return (
                          <div key={loc}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{loc}</div>
                            {!form.workLocations.includes(loc) && (
                              <SelectItem value={loc}>{loc}</SelectItem>
                            )}
                            {areas.map(area => {
                              const val = `${loc} › ${area}`;
                              if (form.workLocations.includes(val)) return null;
                              return <SelectItem key={val} value={val}>↳ {area}</SelectItem>;
                            })}
                          </div>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </FG>

              <FG label="Primary Work Location" required>
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
              </FG>
            </CardContent>
          </Card>

          {/* ===== Employment Details ===== */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Employment Details</CardTitle>
              <CardDescription>Role, department, and employment configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FG label="Employee ID">
                  <div className="flex gap-2">
                    <Input value={form.employeeId} onChange={e => update('employeeId', e.target.value)} className="flex-1" />
                    <Button variant="outline" size="icon" onClick={() => update('employeeId', generateEmployeeId())}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </FG>
                <FG label="Position / Role" required>
                  <Select value={form.position} onValueChange={v => update('position', v)}>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {positions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FG>
                <FG label="Department">
                  <Select value={form.department} onValueChange={v => update('department', v)}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FG>
                <FG label="Employment Type" required>
                  <Select value={form.employmentType} onValueChange={v => update('employmentType', v)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {employmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FG>
                <FG label="Employment Start Date">
                  <Input type="date" value={form.employmentStartDate} onChange={e => update('employmentStartDate', e.target.value)} />
                </FG>
              </div>
            </CardContent>
          </Card>

          {/* ===== Pay Configuration ===== */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pay Configuration</CardTitle>
              <CardDescription>Pay rate type, award selection, and rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FG label="Pay Rate Type">
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
              </FG>

              {/* Award fields */}
              {form.payRateType === 'Award Rate' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FG label="Award" required>
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
                    </FG>
                    <FG label="Classification" required>
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
                    </FG>
                  </div>

                  {/* Award Rate Preview */}
                  {selectedAward && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                      <h4 className="text-sm font-semibold text-foreground mb-2">Applicable Pay Rates</h4>
                      <p className="text-xs text-muted-foreground mb-3">{selectedAward.awardName} — {selectedAward.classification} ({selectedAward.level})</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <RI label="Base Hourly Rate" value={`$${selectedAward.baseHourlyRate.toFixed(2)}/hr`} />
                        {selectedAward.casualLoading && <RI label="Casual Loading" value={`${selectedAward.casualLoading}%`} />}
                        {selectedAward.saturdayRate && <RI label="Saturday" value={`${selectedAward.saturdayRate}%`} />}
                        {selectedAward.sundayRate && <RI label="Sunday" value={`${selectedAward.sundayRate}%`} />}
                        {selectedAward.publicHolidayRate && <RI label="Public Holiday" value={`${selectedAward.publicHolidayRate}%`} />}
                        <RI label="OT (first 2hrs)" value={`${selectedAward.overtimeRates.first2Hours}%`} />
                        <RI label="OT (after 2hrs)" value={`${selectedAward.overtimeRates.after2Hours}%`} />
                      </div>
                      {selectedAward.allowances.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-primary/10">
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">Allowances</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedAward.allowances.map(a => (
                              <Badge key={a.id} variant="outline" className="text-xs">
                                {a.name}: ${a.amount.toFixed(2)}/{a.type.replace('per_', '')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rate Override */}
                  {selectedAward && (
                    <div className="rounded-xl border border-border/60 p-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={form.overrideEnabled}
                          onCheckedChange={(v) => update('overrideEnabled', !!v)}
                        />
                        <span className="text-sm font-medium text-foreground">Override award rates for this employee</span>
                      </label>
                      <p className="text-xs text-muted-foreground mt-1 ml-7">
                        Custom rates will apply instead of the standard award rates. Original award rates are shown as placeholders.
                      </p>

                      {form.overrideEnabled && (
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <FG label="Base Hourly Rate">
                            <Input type="number" step="0.01" value={form.overrideHourlyRate} onChange={e => update('overrideHourlyRate', e.target.value)} placeholder={`$${selectedAward.baseHourlyRate.toFixed(2)}`} />
                          </FG>
                          <FG label="Saturday Rate (%)">
                            <Input type="number" value={form.overrideSaturdayRate} onChange={e => update('overrideSaturdayRate', e.target.value)} placeholder={`${selectedAward.saturdayRate || 0}`} />
                          </FG>
                          <FG label="Sunday Rate (%)">
                            <Input type="number" value={form.overrideSundayRate} onChange={e => update('overrideSundayRate', e.target.value)} placeholder={`${selectedAward.sundayRate || 0}`} />
                          </FG>
                          <FG label="Public Holiday (%)">
                            <Input type="number" value={form.overridePublicHolidayRate} onChange={e => update('overridePublicHolidayRate', e.target.value)} placeholder={`${selectedAward.publicHolidayRate || 0}`} />
                          </FG>
                          <FG label="OT First 2hrs (%)">
                            <Input type="number" value={form.overrideOt1} onChange={e => update('overrideOt1', e.target.value)} placeholder={`${selectedAward.overtimeRates.first2Hours}`} />
                          </FG>
                          <FG label="OT After 2hrs (%)">
                            <Input type="number" value={form.overrideOt2} onChange={e => update('overrideOt2', e.target.value)} placeholder={`${selectedAward.overtimeRates.after2Hours}`} />
                          </FG>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {form.payRateType !== 'Award Rate' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {form.payRateType !== 'Annual Salary' && (
                    <FG label="Hourly Rate">
                      <Input type="number" value={form.hourlyRate} onChange={e => update('hourlyRate', e.target.value)} placeholder="Enter hourly rate" />
                    </FG>
                  )}
                  {form.payRateType === 'Annual Salary' && (
                    <FG label="Annual Salary">
                      <Input type="number" value={form.annualSalary} onChange={e => update('annualSalary', e.target.value)} placeholder="Enter annual salary" />
                    </FG>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ===== Role Assignment & Access Rights ===== */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Role Assignment & Access Rights</CardTitle>
              <CardDescription>System access permissions — select one or more</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* ===== Login Credentials ===== */}
          <Card className="border-primary/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Login Credentials</CardTitle>
              </div>
              <CardDescription>
                Auto-generated credentials will be sent to the employee's email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-muted/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs text-muted-foreground block">Username / Email</Label>
                    <p className="text-sm font-medium text-foreground mt-0.5">
                      {form.email || <span className="text-muted-foreground italic">Enter email above</span>}
                    </p>
                  </div>
                  {form.email && (
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(form.email, 'Email')}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="border-t border-border/50" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs text-muted-foreground block">Temporary Password</Label>
                    <p className="text-sm font-mono font-medium text-foreground mt-0.5">
                      {showPassword ? form.password : '•'.repeat(form.password.length)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(form.password, 'Password')}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => update('password', generatePassword())}>
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                The employee will be prompted to change their password on first login.
              </p>
            </CardContent>
          </Card>

          {/* Sticky bottom save bar */}
          <div className="flex items-center justify-end gap-3 pb-6">
            <Button variant="outline" onClick={() => navigate('/workforce')}>Cancel</Button>
            <Button onClick={handleSave} disabled={!isValid || saving} className="min-w-[180px]">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {saving ? 'Creating...' : 'Create & Issue Login'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

// Field group wrapper
function FG({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
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

// Rate item
function RI({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}
