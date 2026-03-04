import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronRight, Eye, EyeOff, Copy, RefreshCw, CheckCircle2, ArrowLeft, Shield } from 'lucide-react';
import { departments, locations } from '@/data/mockStaffData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const roles = ['Support Worker', 'Team Leader', 'Room Leader', 'Centre Manager', 'Educator', 'Cook', 'Administrator'];

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
    firstName: '',
    lastName: '',
    email: '',
    mobilePhone: '',
    position: '',
    department: '',
    location: '',
    employeeId: generateEmployeeId(),
    password: generatePassword(),
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const isValid = form.firstName && form.lastName && form.email.includes('@') && form.position && form.department && form.location;

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

        <div className="p-6 max-w-3xl space-y-6">
          {/* Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Details</CardTitle>
              <CardDescription>Basic information about the new staff member</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">First Name *</Label>
                  <Input value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="John" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Last Name *</Label>
                  <Input value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Smith" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Email Address *</Label>
                  <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="john@example.com" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Mobile Phone</Label>
                  <Input type="tel" value={form.mobilePhone} onChange={e => update('mobilePhone', e.target.value)} placeholder="0400 000 000" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Employment Details</CardTitle>
              <CardDescription>Role and assignment information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Employee ID</Label>
                  <div className="flex gap-2">
                    <Input value={form.employeeId} onChange={e => update('employeeId', e.target.value)} className="flex-1" />
                    <Button variant="outline" size="icon" onClick={() => update('employeeId', generateEmployeeId())}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Position / Role *</Label>
                  <Select value={form.position} onValueChange={v => update('position', v)}>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Department *</Label>
                  <Select value={form.department} onValueChange={v => update('department', v)}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Location *</Label>
                  <Select value={form.location} onValueChange={v => update('location', v)}>
                    <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                    <SelectContent>
                      {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Login Credentials */}
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
        </div>
      </main>
    </div>
  );
}
