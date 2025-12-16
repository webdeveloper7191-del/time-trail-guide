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
        <div className="border-b bg-card">
          <div className="px-6 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <button
                onClick={() => navigate('/workforce')}
                className="hover:text-foreground transition-colors"
              >
                Staff
              </button>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{staff.firstName} {staff.lastName}</span>
            </div>
          </div>
        </div>

        {/* Profile Header Banner */}
        <div className="relative">
          <div className="h-24 bg-gradient-to-r from-cyan-400 via-cyan-500 to-teal-500" />
          <div className="px-6 pb-4">
            <div className="flex items-end gap-6 -mt-12">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={staff.avatar} alt={`${staff.firstName} ${staff.lastName}`} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {getInitials(staff.firstName, staff.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-background",
                  getStatusColor(staff.status)
                )} />
              </div>
              <div className="flex-1 pb-2">
                <h1 className="text-2xl font-semibold text-foreground">
                  {staff.firstName} {staff.lastName}
                </h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span>{staff.position}</span>
                  <span>•</span>
                  <span>{staff.employeeId}</span>
                </div>
              </div>
              <div className="pb-2 flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Switch Employee</span>
                <Select defaultValue={staff.id}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mockStaff.filter(s => s.status === 'active').map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={s.avatar} />
                            <AvatarFallback className="text-xs">
                              {getInitials(s.firstName, s.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{s.firstName} {s.lastName}</span>
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
        <div className="flex gap-6 p-6">
          {/* Left Sidebar Navigation */}
          <div className="w-72 shrink-0">
            <Card>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {sidebarSections.map((section) => {
                    const isActive = activeSection === section.id;
                    const isExpanded = expandedSections.includes(section.id);
                    
                    return (
                      <button
                        key={section.id}
                        onClick={() => toggleSection(section.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all",
                          isActive
                            ? "bg-primary/10 text-primary border-l-2 border-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <section.icon className="h-4 w-4" />
                          <span className="font-medium">{section.label}</span>
                        </div>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform",
                          isExpanded && "rotate-180"
                        )} />
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
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
              <Card>
                <CardHeader>
                  <CardTitle>Leave & Unavailability</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Leave management coming soon...</p>
                </CardContent>
              </Card>
            )}
            {activeSection === 'hr' && (
              <Card>
                <CardHeader>
                  <CardTitle>HR Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">HR documents and records coming soon...</p>
                </CardContent>
              </Card>
            )}
            {activeSection === 'audit' && (
              <Card>
                <CardHeader>
                  <CardTitle>Employee Audit History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Audit history coming soon...</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
