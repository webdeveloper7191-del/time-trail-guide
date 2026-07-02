import { useState } from 'react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection } from '@/components/ui/off-canvas/FormSection';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  MapPin, UserCog, Activity, MessageSquare, DollarSign, CalendarDays,
  Archive, Clock, Send, FileClock, Download, Info, LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { locations, departments } from '@/data/mockStaffData';

export type BulkActionKey =
  | 'add-locations'
  | 'set-role'
  | 'set-stress-profile'
  | 'send-message'
  | 'set-pay-rates'
  | 'set-leave-balance'
  | 'archive'
  | 'set-working-hours'
  | 'send-invitation'
  | 'set-contracted-hours'
  | 'export';

interface Config {
  title: string;
  icon: LucideIcon;
  explanation: string;
  helper?: string;
  destructive?: boolean;
  ctaLabel: string;
}

export const bulkActionConfig: Record<BulkActionKey, Config> = {
  'add-locations': {
    title: 'Add Locations',
    icon: MapPin,
    explanation:
      'Grant the selected team members access to additional locations. They will start appearing in rosters, availability and shift-offer lists for those sites. Existing location assignments are preserved.',
    helper: 'Use this when opening a new site or when staff cover multiple centres.',
    ctaLabel: 'Add locations',
  },
  'set-role': {
    title: 'Set Role',
    icon: UserCog,
    explanation:
      'Assigns a primary job role to every selected team member. Role drives award classification, default pay rate, qualification requirements and eligibility for shift matching.',
    helper: 'Existing pay conditions are not overwritten — only the role tag is updated.',
    ctaLabel: 'Apply role',
  },
  'set-stress-profile': {
    title: 'Set Stress Profile',
    icon: Activity,
    explanation:
      'Applies a workload / stress profile that limits back-to-back shifts, minimum rest and maximum consecutive days for the selected staff. Used by the auto-scheduler and fatigue engine.',
    helper: 'Profiles: Low, Standard, High-tolerance. Casuals default to Standard unless overridden.',
    ctaLabel: 'Apply profile',
  },
  'send-message': {
    title: 'Send Message',
    icon: MessageSquare,
    explanation:
      'Sends an in-app + email notification to every selected team member. Useful for reminders, policy updates or shift call-outs. Delivery is logged in each staff profile.',
    ctaLabel: 'Send message',
  },
  'set-pay-rates': {
    title: 'Set Pay Rates',
    icon: DollarSign,
    explanation:
      'Overrides the base hourly rate for the selected team members. Award-linked penalties, allowances and overtime multipliers continue to apply on top of the new base.',
    helper: 'Change becomes effective from the next pay period unless a start date is specified.',
    ctaLabel: 'Update pay rates',
  },
  'set-leave-balance': {
    title: 'Set Leave Balance',
    icon: CalendarDays,
    explanation:
      'Manually adjusts opening leave balances (annual, personal, long-service) for the selected staff. Typically used at migration or after a payroll correction.',
    helper: 'An audit entry is written for every adjustment.',
    ctaLabel: 'Update balances',
  },
  archive: {
    title: 'Archive Team Members',
    icon: Archive,
    explanation:
      'Archived staff are removed from rostering, availability and reporting lists but their history (timesheets, pay, documents) is retained for compliance. They can be restored later.',
    helper: 'Any future shifts assigned to these staff will need to be reassigned.',
    destructive: true,
    ctaLabel: 'Archive selected',
  },
  'set-working-hours': {
    title: 'Set Regular Working Hours',
    icon: Clock,
    explanation:
      'Defines the standard weekly availability template for the selected staff (e.g. Mon–Fri 09:00–17:00). Drives auto-scheduling, availability conflicts and overtime thresholds.',
    ctaLabel: 'Apply hours',
  },
  'send-invitation': {
    title: 'Send Invitation',
    icon: Send,
    explanation:
      'Sends (or resends) the paperless onboarding invite to the selected staff so they can complete their profile, upload documents and sign contracts.',
    helper: 'Only staff without an active portal login will receive an invite; the rest are skipped.',
    ctaLabel: 'Send invitations',
  },
  'set-contracted-hours': {
    title: 'Set Contracted Hours',
    icon: FileClock,
    explanation:
      'Sets the guaranteed weekly / fortnightly contracted hours for the selected staff. Used for part-time balancing, over/under-utilisation reporting and award compliance.',
    ctaLabel: 'Update contracts',
  },
  export: {
    title: 'Export Team Member Details',
    icon: Download,
    explanation:
      'Generates a downloadable CSV/Excel export of the selected staff, including personal details, employment type, location assignments and current pay conditions.',
    helper: 'Sensitive fields (bank, TFN) are excluded unless you have Payroll Admin permission.',
    ctaLabel: 'Generate export',
  },
};

interface BulkActionsPanelProps {
  open: boolean;
  action: BulkActionKey | null;
  selectedCount: number;
  onClose: () => void;
  onConfirm: (action: BulkActionKey) => void;
}

export function BulkActionsPanel({ open, action, selectedCount, onClose, onConfirm }: BulkActionsPanelProps) {
  const [locationId, setLocationId] = useState('');
  const [role, setRole] = useState('');
  const [profile, setProfile] = useState('standard');
  const [message, setMessage] = useState('');
  const [rate, setRate] = useState('');
  const [leaveType, setLeaveType] = useState('annual');
  const [leaveBalance, setLeaveBalance] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [contractedHours, setContractedHours] = useState('');
  const [exportFormat, setExportFormat] = useState('csv');

  if (!action) return null;
  const cfg = bulkActionConfig[action];
  const Icon = cfg.icon;

  const handleConfirm = () => {
    onConfirm(action);
    toast.success(`${cfg.title} applied to ${selectedCount} team member${selectedCount === 1 ? '' : 's'}`);
    onClose();
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title={cfg.title}
      description={`Applies to ${selectedCount} selected team member${selectedCount === 1 ? '' : 's'}.`}
      icon={Icon}
      size="md"
      actions={[
        { label: 'Cancel', variant: 'secondary', onClick: onClose },
        {
          label: cfg.ctaLabel,
          variant: cfg.destructive ? 'destructive' : 'primary',
          onClick: handleConfirm,
        },
      ]}
    >
      <div className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm leading-relaxed">
            {cfg.explanation}
            {cfg.helper && (
              <span className="mt-2 block text-xs text-muted-foreground">{cfg.helper}</span>
            )}
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-2">
          <Badge variant="secondary">{selectedCount} selected</Badge>
        </div>

        <FormSection title="Details">
          {action === 'add-locations' && (
            <div>
              <Label>Location</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {action === 'set-role' && (
            <div>
              <Label>Role / Department</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {action === 'set-stress-profile' && (
            <div>
              <Label>Stress profile</Label>
              <Select value={profile} onValueChange={setProfile}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low — max 4 consecutive days, 12h rest</SelectItem>
                  <SelectItem value="standard">Standard — max 5 days, 10h rest</SelectItem>
                  <SelectItem value="high">High-tolerance — max 6 days, 8h rest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {action === 'send-message' && (
            <div>
              <Label>Message</Label>
              <Textarea
                rows={5}
                placeholder="Type your message…"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>
          )}
          {action === 'set-pay-rates' && (
            <div>
              <Label>New base hourly rate ($)</Label>
              <Input type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} placeholder="e.g. 32.50" />
            </div>
          )}
          {action === 'set-leave-balance' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Leave type</Label>
                <Select value={leaveType} onValueChange={setLeaveType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="personal">Personal / Sick</SelectItem>
                    <SelectItem value="long-service">Long service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Opening balance (hours)</Label>
                <Input type="number" value={leaveBalance} onChange={e => setLeaveBalance(e.target.value)} />
              </div>
            </div>
          )}
          {action === 'set-working-hours' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start</Label>
                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div>
                <Label>End</Label>
                <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
          )}
          {action === 'set-contracted-hours' && (
            <div>
              <Label>Contracted hours per week</Label>
              <Input type="number" value={contractedHours} onChange={e => setContractedHours(e.target.value)} placeholder="e.g. 38" />
            </div>
          )}
          {action === 'export' && (
            <div>
              <Label>Format</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {(action === 'archive' || action === 'send-invitation') && (
            <p className="text-sm text-muted-foreground">
              No additional input required. Review the explanation above and confirm to proceed.
            </p>
          )}
        </FormSection>
      </div>
    </PrimaryOffCanvas>
  );
}
