import React, { useState } from 'react';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/mui/Button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Candidate } from '@/types/agency';
import { format } from 'date-fns';
import {
  User, Mail, Phone, MapPin, Star, Shield, Clock, Calendar,
  Award, FileText, TrendingUp, AlertTriangle, CheckCircle2,
  Briefcase, Activity, ChevronRight, Edit, Download
} from 'lucide-react';

interface CandidateProfilePanelProps {
  open: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onEdit?: (candidate: Candidate) => void;
  onViewAvailability?: (candidate: Candidate) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CandidateProfilePanel({ open, onClose, candidate, onEdit, onViewAvailability }: CandidateProfilePanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'shifts' | 'compliance' | 'notes'>('overview');

  if (!candidate) return null;

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'shifts' as const, label: 'Shifts & History' },
    { id: 'compliance' as const, label: 'Compliance' },
    { id: 'notes' as const, label: 'Notes' },
  ];

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title={`${candidate.firstName} ${candidate.lastName}`}
      description={candidate.primaryRole}
      icon={User}
      size="xl"
      isBackground
      actions={[
        { label: 'Edit Profile', variant: 'outlined', onClick: () => onEdit?.(candidate), icon: <Edit className="h-4 w-4" /> },
        { label: 'View Availability', variant: 'primary', onClick: () => onViewAvailability?.(candidate), icon: <Calendar className="h-4 w-4" /> },
      ]}
    >
      {/* Profile Header Card */}
      <FormSection title="Profile">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-primary">
              {candidate.firstName[0]}{candidate.lastName[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold">{candidate.firstName} {candidate.lastName}</h3>
              <Badge className={cn(
                'text-xs border-0',
                candidate.status === 'available' ? 'bg-status-approved-bg text-status-approved' :
                candidate.status === 'on_shift' ? 'bg-primary/10 text-primary' :
                'bg-muted text-muted-foreground'
              )}>
                {candidate.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{candidate.primaryRole}</p>
            {candidate.secondaryRoles.length > 0 && (
              <p className="text-[13px] text-muted-foreground mt-0.5">Also: {candidate.secondaryRoles.join(', ')}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-[13px] text-muted-foreground">
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {candidate.email}</span>
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {candidate.phone}</span>
            </div>
          </div>
        </div>
      </FormSection>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-border -mx-4 sm:-mx-6 px-4 sm:px-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Overview Tab ─────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-5 pt-1">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Rating', value: candidate.averageRating.toFixed(1), icon: Star, color: 'text-amber-600 bg-amber-100' },
              { label: 'Shifts', value: candidate.totalShiftsCompleted, icon: Briefcase, color: 'text-primary bg-primary/10' },
              { label: 'Compliance', value: `${candidate.complianceScore}%`, icon: Shield, color: candidate.complianceScore >= 90 ? 'text-status-approved bg-status-approved-bg' : 'text-status-pending bg-status-pending-bg' },
              { label: 'Reliability', value: `${candidate.reliabilityScore}%`, icon: Activity, color: 'text-blue-600 bg-blue-100' },
            ].map(stat => (
              <div key={stat.label} className="bg-background border border-border rounded-xl p-3 text-center">
                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center mx-auto mb-1.5', stat.color.split(' ')[1])}>
                  <stat.icon className={cn('h-4 w-4', stat.color.split(' ')[0])} />
                </div>
                <p className="text-base font-bold">{stat.value}</p>
                <p className="text-[13px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Employment Details */}
          <FormSection title="Employment Details">
            <FormRow columns={2}>
              <FormField label="Employment Type">
                <p className="text-sm capitalize">{candidate.employmentType.replace('_', ' ')}</p>
              </FormField>
              <FormField label="Award Classification">
                <p className="text-sm">{candidate.awardClassification}</p>
              </FormField>
            </FormRow>
            <FormRow columns={2}>
              <FormField label="Pay Rate">
                <p className="text-sm font-semibold text-primary">${candidate.payRate}/hr</p>
              </FormField>
              <FormField label="Years Experience">
                <p className="text-sm">{candidate.yearsExperience} years</p>
              </FormField>
            </FormRow>
          </FormSection>

          {/* Skills */}
          <FormSection title="Skills">
            <div className="space-y-2">
              {candidate.skills.map(skill => (
                <div key={skill.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background">
                  <div>
                    <p className="text-sm font-medium">{skill.name}</p>
                    <p className="text-[13px] text-muted-foreground">{skill.yearsExperience} years experience</p>
                  </div>
                  <Badge className={cn(
                    'text-xs border-0',
                    skill.level === 'expert' ? 'bg-primary/10 text-primary' :
                    skill.level === 'advanced' ? 'bg-status-approved-bg text-status-approved' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {skill.level}
                  </Badge>
                </div>
              ))}
            </div>
          </FormSection>

          {/* Availability Summary */}
          <FormSection title="Weekly Availability">
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS.map((day, idx) => {
                const avail = candidate.availability.find(a => a.dayOfWeek === idx);
                return (
                  <div key={day} className={cn(
                    'text-center p-2 rounded-lg border',
                    avail?.isAvailable ? 'bg-status-approved-bg border-status-approved/20' : 'bg-muted/50 border-border'
                  )}>
                    <p className="text-xs font-medium mb-0.5">{day}</p>
                    {avail?.isAvailable ? (
                      <p className="text-[11px] text-status-approved">{avail.startTime}–{avail.endTime}</p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">Off</p>
                    )}
                  </div>
                );
              })}
            </div>
          </FormSection>

          {/* Preferred Locations */}
          <FormSection title="Preferred Locations">
            <div className="flex flex-wrap gap-2">
              {candidate.preferredLocations.map(loc => (
                <Badge key={loc} variant="secondary" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" /> {loc}
                </Badge>
              ))}
              <Badge variant="outline" className="text-xs">
                Max travel: {candidate.maxTravelDistance}km
              </Badge>
            </div>
          </FormSection>

          {/* Fatigue Tracking */}
          <FormSection title="Fatigue & Workload">
            <FormRow columns={2}>
              <FormField label="Hours This Week">
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold">{candidate.hoursWorkedThisWeek}h / 38h</p>
                  <Progress value={(candidate.hoursWorkedThisWeek / 38) * 100} className="h-2" />
                </div>
              </FormField>
              <FormField label="No-Shows">
                <p className={cn('text-sm font-semibold', candidate.noShowCount > 0 ? 'text-status-rejected' : 'text-status-approved')}>
                  {candidate.noShowCount}
                </p>
              </FormField>
            </FormRow>
            {candidate.lastShiftEndTime && (
              <FormField label="Last Shift Ended">
                <p className="text-sm">{format(new Date(candidate.lastShiftEndTime), 'MMM d, yyyy h:mm a')}</p>
              </FormField>
            )}
          </FormSection>
        </div>
      )}

      {/* ─── Shifts & History Tab ─────────────────────────────────── */}
      {activeTab === 'shifts' && (
        <div className="space-y-5 pt-1">
          <FormSection title="Shift Summary">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg border border-border bg-background">
                <p className="text-xl font-bold">{candidate.totalShiftsCompleted}</p>
                <p className="text-[13px] text-muted-foreground">Completed</p>
              </div>
              <div className="text-center p-3 rounded-lg border border-border bg-background">
                <p className="text-xl font-bold text-status-rejected">{candidate.noShowCount}</p>
                <p className="text-[13px] text-muted-foreground">No Shows</p>
              </div>
              <div className="text-center p-3 rounded-lg border border-border bg-background">
                <p className="text-xl font-bold text-status-approved">{candidate.reliabilityScore}%</p>
                <p className="text-[13px] text-muted-foreground">Reliability</p>
              </div>
            </div>
          </FormSection>

          <FormSection title="Recent Shifts">
            <div className="space-y-2">
              {[
                { client: 'Royal North Shore Hospital', date: 'Jan 14, 2025', time: '07:00–15:30', status: 'completed', rating: 5 },
                { client: 'Sydney Children\'s Hospital', date: 'Jan 12, 2025', time: '15:00–23:00', status: 'completed', rating: 4 },
                { client: 'The Langham Sydney', date: 'Jan 10, 2025', time: '16:00–23:30', status: 'completed', rating: 5 },
                { client: 'Bright Stars Childcare', date: 'Jan 8, 2025', time: '07:00–18:00', status: 'completed', rating: 5 },
              ].map((shift, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                  <div>
                    <p className="text-sm font-medium">{shift.client}</p>
                    <p className="text-[13px] text-muted-foreground">{shift.date} · {shift.time}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-medium">{shift.rating}</span>
                    </div>
                    <Badge className="text-xs bg-status-approved-bg text-status-approved border-0">
                      {shift.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </FormSection>
        </div>
      )}

      {/* ─── Compliance Tab ───────────────────────────────────────── */}
      {activeTab === 'compliance' && (
        <div className="space-y-5 pt-1">
          <FormSection title="Compliance Score">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-background border border-border">
              <div className={cn(
                'h-14 w-14 rounded-full flex items-center justify-center',
                candidate.complianceScore >= 90 ? 'bg-status-approved-bg' : candidate.complianceScore >= 70 ? 'bg-status-pending-bg' : 'bg-status-rejected-bg'
              )}>
                <span className={cn(
                  'text-lg font-bold',
                  candidate.complianceScore >= 90 ? 'text-status-approved' : candidate.complianceScore >= 70 ? 'text-status-pending' : 'text-status-rejected'
                )}>
                  {candidate.complianceScore}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {candidate.complianceScore >= 90 ? 'Fully Compliant' : candidate.complianceScore >= 70 ? 'Partially Compliant' : 'Action Required'}
                </p>
                <p className="text-[13px] text-muted-foreground">
                  {candidate.certifications.length} certifications on file
                </p>
              </div>
            </div>
          </FormSection>

          <FormSection title="Certifications">
            <div className="space-y-2">
              {candidate.certifications.map(cert => (
                <div key={cert.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-9 w-9 rounded-lg flex items-center justify-center',
                      cert.status === 'valid' ? 'bg-status-approved-bg' :
                      cert.status === 'expiring_soon' ? 'bg-status-pending-bg' :
                      'bg-status-rejected-bg'
                    )}>
                      {cert.status === 'valid' ? <CheckCircle2 className="h-4 w-4 text-status-approved" /> :
                       cert.status === 'expiring_soon' ? <AlertTriangle className="h-4 w-4 text-status-pending" /> :
                       <AlertTriangle className="h-4 w-4 text-status-rejected" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{cert.name}</p>
                      <p className="text-[13px] text-muted-foreground">
                        {cert.issuer} · Issued {format(new Date(cert.issueDate), 'MMM yyyy')}
                        {cert.expiryDate && ` · Expires ${format(new Date(cert.expiryDate), 'MMM yyyy')}`}
                      </p>
                    </div>
                  </div>
                  <Badge className={cn(
                    'text-xs border-0',
                    cert.status === 'valid' ? 'bg-status-approved-bg text-status-approved' :
                    cert.status === 'expiring_soon' ? 'bg-status-pending-bg text-status-pending' :
                    'bg-status-rejected-bg text-status-rejected'
                  )}>
                    {cert.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </FormSection>
        </div>
      )}

      {/* ─── Notes Tab ────────────────────────────────────────────── */}
      {activeTab === 'notes' && (
        <div className="space-y-5 pt-1">
          <FormSection title="Internal Notes">
            <div className="space-y-2">
              {[
                { date: 'Jan 14, 2025', author: 'Sarah Mitchell', note: 'Excellent feedback from Royal North Shore. Requested by name for future shifts.' },
                { date: 'Jan 8, 2025', author: 'Sarah Mitchell', note: 'Completed orientation at Bright Stars. All compliance docs verified.' },
                { date: 'Dec 20, 2024', author: 'Admin', note: 'Updated pay rate from $45/hr to $48.50/hr effective January 2025.' },
              ].map((note, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-border bg-background">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-medium">{note.author}</span>
                    <span className="text-[13px] text-muted-foreground">{note.date}</span>
                  </div>
                  <p className="text-sm text-foreground">{note.note}</p>
                </div>
              ))}
            </div>
          </FormSection>

          <FormSection title="Activity Log">
            <div className="space-y-1.5">
              {[
                { action: 'Shift completed', detail: 'Royal North Shore Hospital', time: '2 days ago' },
                { action: 'Availability updated', detail: 'Added Saturday availability', time: '5 days ago' },
                { action: 'Certification uploaded', detail: 'First Aid Certificate renewed', time: '2 weeks ago' },
                { action: 'Profile joined', detail: 'Added to Pinnacle Staffing pool', time: format(new Date(candidate.joinedAt), 'MMM d, yyyy') },
              ].map((log, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">{log.action}</span>
                    <span className="text-muted-foreground"> · {log.detail}</span>
                  </div>
                  <span className="text-[13px] text-muted-foreground shrink-0">{log.time}</span>
                </div>
              ))}
            </div>
          </FormSection>
        </div>
      )}
    </PrimaryOffCanvas>
  );
}

export default CandidateProfilePanel;
