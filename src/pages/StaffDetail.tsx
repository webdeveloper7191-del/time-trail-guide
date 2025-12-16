import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  User,
  Building2,
  CreditCard,
  Clock,
  CalendarDays,
  Briefcase,
  History,
  Settings,
  Edit,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { mockStaff } from '@/data/mockStaffData';
import { employmentStatusLabels, employmentTypeLabels, payRateTypeLabels, genderLabels } from '@/types/staff';
import { cn } from '@/lib/utils';
import { StaffPersonalSection } from '@/components/staff/StaffPersonalSection';
import { StaffPayConditionsSection } from '@/components/staff/StaffPayConditionsSection';
import { StaffPayConfigurationSection } from '@/components/staff/StaffPayConfigurationSection';
import { StaffAwardRuleSection } from '@/components/staff/StaffAwardRuleSection';
import { StaffAvailabilitySection } from '@/components/staff/StaffAvailabilitySection';
import { StaffBankDetailsSection } from '@/components/staff/StaffBankDetailsSection';
import { StaffQualificationsSection } from '@/components/staff/StaffQualificationsSection';

import { Award } from 'lucide-react';

const sidebarSections = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'bank', label: 'Bank Details & Super Fund', icon: Building2 },
  { id: 'pay-conditions', label: 'Pay Conditions', icon: CreditCard },
  { id: 'qualifications', label: 'Qualifications', icon: Award },
  { id: 'time-attendance', label: 'Time & Attendance', icon: Clock },
  { id: 'leave', label: 'Leave & Unavailability', icon: CalendarDays },
  { id: 'hr', label: 'HR', icon: Briefcase },
  { id: 'audit', label: 'Employee Audit History', icon: History },
];

export default function StaffDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('pay-conditions');
  const [expandedSections, setExpandedSections] = useState<string[]>(['pay-conditions']);

  const staff = useMemo(() => mockStaff.find((s) => s.id === id), [id]);

  if (!staff) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Staff member not found</p>
            <Button onClick={() => navigate('/workforce')} className="mt-4">
              Back to Staff List
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const toggleSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((s) => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'onboarding':
        return 'bg-amber-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'terminated':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {/* Breadcrumb & Header */}
        <div className="border-b border-border/50 bg-card">
          <div className="px-6 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <button
                onClick={() => navigate('/workforce')}
                className="hover:text-foreground transition-colors font-medium"
              >
                Staff
              </button>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">{staff.firstName} {staff.lastName}</span>
            </div>
          </div>
        </div>

        {/* Profile Header Banner */}
        <div className="relative">
          <div className="h-28 bg-gradient-to-r from-primary via-primary/90 to-primary/70" />
          <div className="px-6 pb-6">
            <div className="flex items-end gap-6 -mt-14">
              <div className="relative">
                <Avatar className="h-28 w-28 border-4 border-card shadow-xl ring-4 ring-primary/20">
                  <AvatarImage src={staff.avatar} alt={`${staff.firstName} ${staff.lastName}`} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-semibold">
                    {getInitials(staff.firstName, staff.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "absolute bottom-2 right-2 h-5 w-5 rounded-full border-2 border-card shadow-md",
                  getStatusColor(staff.status)
                )} />
              </div>
              <div className="flex-1 pb-3">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  {staff.firstName} {staff.lastName}
                </h1>
                <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                  <span className="font-medium">{staff.position}</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{staff.employeeId}</span>
                </div>
              </div>
              <div className="pb-3 flex items-center gap-3">
                <Select 
                  value={staff.id}
                  onValueChange={(value) => navigate(`/workforce/${value}`)}
                >
                  <SelectTrigger className="w-[200px] h-9 bg-card border-border/50 shadow-sm">
                    <SelectValue placeholder="Switch Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockStaff.filter(s => s.status === 'active').map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={s.avatar} />
                            <AvatarFallback className="text-xs bg-muted">
                              {getInitials(s.firstName, s.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{s.firstName} {s.lastName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6 p-6 pt-0">
          {/* Left Sidebar Navigation */}
          <div className="w-64 shrink-0">
            <div className="card-material-elevated p-2 sticky top-6">
              <nav className="space-y-0.5">
                {sidebarSections.map((section) => {
                  const isActive = activeSection === section.id;
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => toggleSection(section.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <section.icon className={cn("h-4 w-4", isActive && "text-primary-foreground")} />
                      <span className="font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 min-w-0">
            {activeSection === 'personal' && (
              <StaffPersonalSection staff={staff} />
            )}
            {activeSection === 'bank' && (
              <StaffBankDetailsSection staff={staff} />
            )}
            {activeSection === 'pay-conditions' && (
              <StaffPayConditionsSection staff={staff} />
            )}
            {activeSection === 'time-attendance' && (
              <StaffAvailabilitySection staff={staff} />
            )}
            {activeSection === 'qualifications' && (
              <StaffQualificationsSection staff={staff} />
            )}
            {activeSection === 'leave' && (
              <div className="card-material-elevated p-6">
                <h3 className="section-header mb-4">Leave & Unavailability</h3>
                <p className="text-muted-foreground">Leave management coming soon...</p>
              </div>
            )}
            {activeSection === 'hr' && (
              <div className="card-material-elevated p-6">
                <h3 className="section-header mb-4">HR Documents</h3>
                <p className="text-muted-foreground">HR documents and records coming soon...</p>
              </div>
            )}
            {activeSection === 'audit' && (
              <div className="card-material-elevated p-6">
                <h3 className="section-header mb-4">Employee Audit History</h3>
                <p className="text-muted-foreground">Audit history coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
