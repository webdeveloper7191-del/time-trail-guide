import { useState } from 'react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection } from '@/components/ui/off-canvas/FormSection';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  MapPin, UserCog, Activity, Mail, DollarSign, CalendarDays,
  Archive, Clock, Send, FileClock, Download, Info, Plus, Trash2, LucideIcon, Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';
import { locations, departments } from '@/data/mockStaffData';
import { leaveTypeLabels, LeaveType } from '@/types/leaveAccrual';
import { employmentStatusLabels, streamOptions, EmploymentStatus } from '@/types/staff';

export type BulkActionKey =
  | 'add-locations'
  | 'set-role'
  | 'set-stress-profile'
  | 'send-email'
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
      'Fine-tune the workload / fatigue thresholds the auto-scheduler and compliance engine will enforce for the selected staff.',
    helper: 'Values override the tenant default profile until cleared.',
    ctaLabel: 'Apply profile',
  },
  'send-email': {
    title: 'Send Email',
    icon: Mail,
    explanation:
      'Sends an email (and portal notification) to every selected team member. Useful for reminders, policy updates or shift call-outs. Delivery is logged in each staff profile.',
    ctaLabel: 'Send email',
  },
  'set-pay-rates': {
    title: 'Set Pay Conditions',
    icon: DollarSign,
    explanation:
      'Set full pay conditions for the selected team members — base rate, employment basis, penalty multipliers, overtime thresholds and allowances.',
    helper: 'Change becomes effective from the nominated date; audit entry is written.',
    ctaLabel: 'Update pay conditions',
  },
  'set-leave-balance': {
    title: 'Set Leave Balance',
    icon: CalendarDays,
    explanation:
      'Set opening balances for each leave type as at a specific date. Typically used at migration or after a payroll correction.',
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
      'Define the standard weekly availability template — pick the day, time window and area for each working day. Drives auto-scheduling, availability conflicts and overtime thresholds.',
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
    title: 'Set Weekly Contracted Hours',
    icon: FileClock,
    explanation:
      'Set guaranteed weekly contracted hours for the selected staff, along with min/max bands and the effective date. Used for part-time balancing, over/under-utilisation reporting and award compliance.',
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

const DAYS: { key: string; label: string }[] = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

const AREAS = ['Room A', 'Room B', 'Room C', 'Kitchen', 'Outdoor Area', 'Reception'];

interface BulkActionsPanelProps {
  open: boolean;
  action: BulkActionKey | null;
  selectedCount: number;
  onClose: () => void;
  onConfirm: (action: BulkActionKey) => void;
}

export function BulkActionsPanel({ open, action, selectedCount, onClose, onConfirm }: BulkActionsPanelProps) {
  // Simple shared state
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [role, setRole] = useState('');
  const [exportFormat, setExportFormat] = useState('csv');

  // Stress profile
  const [stress, setStress] = useState({
    maxConsecutiveDays: 5,
    minRestHours: 10,
    maxHoursPerDay: 10,
    maxHoursPerWeek: 38,
    maxNightShiftsPerWeek: 3,
    allowSplitShifts: false,
    fatigueScoreCap: 70,
  });

  // Email
  const [email, setEmail] = useState({
    subject: '',
    body: '',
    priority: 'normal',
    ccPayroll: false,
    requireAck: false,
  });

  // Pay conditions
  const [pay, setPay] = useState({
    employmentType: 'permanent_full_time',
    basis: 'hourly',
    baseRate: '',
    salaryAnnual: '',
    award: '',
    classification: '',
    saturdayLoading: '1.25',
    sundayLoading: '1.75',
    publicHolidayLoading: '2.50',
    eveningLoading: '1.15',
    otAfterHoursPerDay: '8',
    otRate1: '1.5',
    otRate2: '2.0',
    otAfterHoursPerWeek: '38',
    superRate: '11.5',
    effectiveDate: new Date().toISOString().slice(0, 10),
  });
  const [allowances, setAllowances] = useState<{ name: string; amount: string; unit: string }[]>([
    { name: 'Meal Allowance', amount: '15.00', unit: 'per_shift' },
  ]);

  // Leave balances (all types)
  const [leaveAsAt, setLeaveAsAt] = useState(new Date().toISOString().slice(0, 10));
  const [leaveBalances, setLeaveBalances] = useState<Record<LeaveType, string>>(
    Object.keys(leaveTypeLabels).reduce((acc, k) => {
      acc[k as LeaveType] = '';
      return acc;
    }, {} as Record<LeaveType, string>),
  );

  // Working hours per day
  const [workingHours, setWorkingHours] = useState(
    DAYS.reduce((acc, d) => {
      acc[d.key] = { enabled: false, start: '09:00', end: '17:00', area: '' };
      return acc;
    }, {} as Record<string, { enabled: boolean; start: string; end: string; area: string }>),
  );

  // Contracted hours
  const [contract, setContract] = useState({
    weekly: '',
    min: '',
    max: '',
    contractType: 'part_time',
    averagingPeriodWeeks: '4',
    effectiveDate: new Date().toISOString().slice(0, 10),
  });

  if (!action) return null;
  const cfg = bulkActionConfig[action];
  const Icon = cfg.icon;

  const toggleLocation = (loc: string) => {
    setLocationIds(prev => prev.includes(loc) ? prev.filter(x => x !== loc) : [...prev, loc]);
  };

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
      size={action === 'set-pay-rates' || action === 'set-working-hours' || action === 'set-leave-balance' ? 'lg' : 'md'}
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
        <div className="rounded-md border border-border bg-muted/40 p-3">
          <div className="flex gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="text-sm leading-relaxed">
              {cfg.explanation}
              {cfg.helper && (
                <span className="mt-2 block text-xs text-muted-foreground">{cfg.helper}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary">{selectedCount} selected</Badge>
        </div>

        {action === 'add-locations' && (
          <FormSection title="Locations">
            <div className="grid grid-cols-2 gap-2">
              {locations.map(l => (
                <label key={l} className="flex items-center gap-2 rounded border border-border p-2 cursor-pointer hover:bg-muted/40">
                  <Checkbox checked={locationIds.includes(l)} onCheckedChange={() => toggleLocation(l)} />
                  <span className="text-sm">{l}</span>
                </label>
              ))}
            </div>
          </FormSection>
        )}

        {action === 'set-role' && (
          <FormSection title="Role">
            <Label>Role / Department</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormSection>
        )}

        {action === 'set-stress-profile' && (
          <FormSection title="Fatigue & workload thresholds">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Max consecutive days</Label>
                <Input type="number" value={stress.maxConsecutiveDays}
                  onChange={e => setStress({ ...stress, maxConsecutiveDays: +e.target.value })} />
              </div>
              <div>
                <Label>Min rest between shifts (hrs)</Label>
                <Input type="number" value={stress.minRestHours}
                  onChange={e => setStress({ ...stress, minRestHours: +e.target.value })} />
              </div>
              <div>
                <Label>Max hours per day</Label>
                <Input type="number" value={stress.maxHoursPerDay}
                  onChange={e => setStress({ ...stress, maxHoursPerDay: +e.target.value })} />
              </div>
              <div>
                <Label>Max hours per week</Label>
                <Input type="number" value={stress.maxHoursPerWeek}
                  onChange={e => setStress({ ...stress, maxHoursPerWeek: +e.target.value })} />
              </div>
              <div>
                <Label>Max night shifts / week</Label>
                <Input type="number" value={stress.maxNightShiftsPerWeek}
                  onChange={e => setStress({ ...stress, maxNightShiftsPerWeek: +e.target.value })} />
              </div>
              <div>
                <Label>Fatigue score cap (0-100)</Label>
                <Input type="number" value={stress.fatigueScoreCap}
                  onChange={e => setStress({ ...stress, fatigueScoreCap: +e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded border border-border p-3 mt-2">
              <div>
                <p className="text-sm font-medium">Allow split shifts</p>
                <p className="text-xs text-muted-foreground">Multiple shifts in the same day with a gap.</p>
              </div>
              <Switch checked={stress.allowSplitShifts}
                onCheckedChange={v => setStress({ ...stress, allowSplitShifts: v })} />
            </div>
          </FormSection>
        )}

        {action === 'send-email' && (
          <FormSection title="Email">
            <div>
              <Label>Subject</Label>
              <Input value={email.subject} onChange={e => setEmail({ ...email, subject: e.target.value })}
                placeholder="e.g. Roster changes for next week" />
            </div>
            <div>
              <Label>Message body</Label>
              <Textarea rows={7} value={email.body}
                onChange={e => setEmail({ ...email, body: e.target.value })}
                placeholder="Write your message. Merge tags {{first_name}}, {{location}} are supported." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority</Label>
                <Select value={email.priority} onValueChange={v => setEmail({ ...email, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col justify-end gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={email.ccPayroll} onCheckedChange={v => setEmail({ ...email, ccPayroll: !!v })} />
                  CC Payroll inbox
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={email.requireAck} onCheckedChange={v => setEmail({ ...email, requireAck: !!v })} />
                  Require read acknowledgement
                </label>
              </div>
            </div>
          </FormSection>
        )}

        {action === 'set-pay-rates' && (
          <>
            <FormSection title="Employment & base pay">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Employment type</Label>
                  <Select value={pay.employmentType} onValueChange={v => setPay({ ...pay, employmentType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent_full_time">Permanent — Full time</SelectItem>
                      <SelectItem value="permanent_part_time">Permanent — Part time</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="fixed_term">Fixed term</SelectItem>
                      <SelectItem value="agency">Agency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Pay basis</Label>
                  <Select value={pay.basis} onValueChange={v => setPay({ ...pay, basis: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="salary">Annual salary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {pay.basis === 'hourly' ? (
                  <div>
                    <Label>Base hourly rate ($)</Label>
                    <Input type="number" step="0.01" value={pay.baseRate}
                      onChange={e => setPay({ ...pay, baseRate: e.target.value })} placeholder="e.g. 32.50" />
                  </div>
                ) : (
                  <div>
                    <Label>Annual salary ($)</Label>
                    <Input type="number" step="0.01" value={pay.salaryAnnual}
                      onChange={e => setPay({ ...pay, salaryAnnual: e.target.value })} placeholder="e.g. 78000" />
                  </div>
                )}
                <div>
                  <Label>Superannuation %</Label>
                  <Input type="number" step="0.1" value={pay.superRate}
                    onChange={e => setPay({ ...pay, superRate: e.target.value })} />
                </div>
                <div>
                  <Label>Award</Label>
                  <Input value={pay.award} onChange={e => setPay({ ...pay, award: e.target.value })}
                    placeholder="e.g. MA000120" />
                </div>
                <div>
                  <Label>Classification / level</Label>
                  <Input value={pay.classification} onChange={e => setPay({ ...pay, classification: e.target.value })}
                    placeholder="e.g. Level 3.2" />
                </div>
                <div>
                  <Label>Effective from</Label>
                  <Input type="date" value={pay.effectiveDate}
                    onChange={e => setPay({ ...pay, effectiveDate: e.target.value })} />
                </div>
              </div>
            </FormSection>

            <FormSection title="Penalty loadings (multiplier)">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Saturday</Label>
                  <Input type="number" step="0.01" value={pay.saturdayLoading}
                    onChange={e => setPay({ ...pay, saturdayLoading: e.target.value })} />
                </div>
                <div>
                  <Label>Sunday</Label>
                  <Input type="number" step="0.01" value={pay.sundayLoading}
                    onChange={e => setPay({ ...pay, sundayLoading: e.target.value })} />
                </div>
                <div>
                  <Label>Public holiday</Label>
                  <Input type="number" step="0.01" value={pay.publicHolidayLoading}
                    onChange={e => setPay({ ...pay, publicHolidayLoading: e.target.value })} />
                </div>
                <div>
                  <Label>Evening / afternoon</Label>
                  <Input type="number" step="0.01" value={pay.eveningLoading}
                    onChange={e => setPay({ ...pay, eveningLoading: e.target.value })} />
                </div>
              </div>
            </FormSection>

            <FormSection title="Overtime">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>OT after hrs / day</Label>
                  <Input type="number" step="0.5" value={pay.otAfterHoursPerDay}
                    onChange={e => setPay({ ...pay, otAfterHoursPerDay: e.target.value })} />
                </div>
                <div>
                  <Label>OT after hrs / week</Label>
                  <Input type="number" step="0.5" value={pay.otAfterHoursPerWeek}
                    onChange={e => setPay({ ...pay, otAfterHoursPerWeek: e.target.value })} />
                </div>
                <div>
                  <Label>First tier multiplier</Label>
                  <Input type="number" step="0.01" value={pay.otRate1}
                    onChange={e => setPay({ ...pay, otRate1: e.target.value })} />
                </div>
                <div>
                  <Label>Second tier multiplier</Label>
                  <Input type="number" step="0.01" value={pay.otRate2}
                    onChange={e => setPay({ ...pay, otRate2: e.target.value })} />
                </div>
              </div>
            </FormSection>

            <FormSection title="Allowances">
              <div className="space-y-2">
                {allowances.map((a, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_120px_140px_36px] gap-2 items-end">
                    <div>
                      {idx === 0 && <Label>Name</Label>}
                      <Input value={a.name}
                        onChange={e => setAllowances(allowances.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} />
                    </div>
                    <div>
                      {idx === 0 && <Label>Amount ($)</Label>}
                      <Input type="number" step="0.01" value={a.amount}
                        onChange={e => setAllowances(allowances.map((x, i) => i === idx ? { ...x, amount: e.target.value } : x))} />
                    </div>
                    <div>
                      {idx === 0 && <Label>Unit</Label>}
                      <Select value={a.unit}
                        onValueChange={v => setAllowances(allowances.map((x, i) => i === idx ? { ...x, unit: v } : x))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_hour">per hour</SelectItem>
                          <SelectItem value="per_shift">per shift</SelectItem>
                          <SelectItem value="per_day">per day</SelectItem>
                          <SelectItem value="per_week">per week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button size="icon" variant="ghost"
                      onClick={() => setAllowances(allowances.filter((_, i) => i !== idx))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm"
                  onClick={() => setAllowances([...allowances, { name: '', amount: '', unit: 'per_shift' }])}>
                  <Plus className="h-4 w-4 mr-1" /> Add allowance
                </Button>
              </div>
            </FormSection>
          </>
        )}

        {action === 'set-leave-balance' && (
          <FormSection title="Opening balances">
            <div>
              <Label>Balances as at</Label>
              <Input type="date" value={leaveAsAt} onChange={e => setLeaveAsAt(e.target.value)} className="max-w-[220px]" />
              <p className="text-xs text-muted-foreground mt-1">Balances entered below are the opening figures on this date. Accruals from this date forward will be added by the leave engine.</p>
            </div>
            <Separator className="my-2" />
            <div className="space-y-2">
              {(Object.keys(leaveTypeLabels) as LeaveType[]).map(type => (
                <div key={type} className="grid grid-cols-[1fr_140px_100px] gap-3 items-center">
                  <Label className="mb-0 font-normal">{leaveTypeLabels[type]}</Label>
                  <Input type="number" step="0.01" value={leaveBalances[type]}
                    onChange={e => setLeaveBalances({ ...leaveBalances, [type]: e.target.value })}
                    placeholder="0.00" />
                  <span className="text-xs text-muted-foreground">hours</span>
                </div>
              ))}
            </div>
          </FormSection>
        )}

        {action === 'set-working-hours' && (
          <FormSection title="Weekly template">
            <p className="text-xs text-muted-foreground mb-2">Tick the days the staff normally work and set the time window and area for each.</p>
            <div className="space-y-2">
              {DAYS.map(d => {
                const row = workingHours[d.key];
                return (
                  <div key={d.key} className="grid grid-cols-[110px_1fr_1fr_1.2fr] gap-2 items-center rounded border border-border p-2">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={row.enabled}
                        onCheckedChange={v => setWorkingHours({ ...workingHours, [d.key]: { ...row, enabled: !!v } })} />
                      {d.label}
                    </label>
                    <Input type="time" value={row.start} disabled={!row.enabled}
                      onChange={e => setWorkingHours({ ...workingHours, [d.key]: { ...row, start: e.target.value } })} />
                    <Input type="time" value={row.end} disabled={!row.enabled}
                      onChange={e => setWorkingHours({ ...workingHours, [d.key]: { ...row, end: e.target.value } })} />
                    <Select value={row.area} disabled={!row.enabled}
                      onValueChange={v => setWorkingHours({ ...workingHours, [d.key]: { ...row, area: v } })}>
                      <SelectTrigger><SelectValue placeholder="Area" /></SelectTrigger>
                      <SelectContent>
                        {AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </FormSection>
        )}

        {action === 'set-contracted-hours' && (
          <FormSection title="Weekly contracted hours">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Contracted hours / week</Label>
                <Input type="number" step="0.5" value={contract.weekly}
                  onChange={e => setContract({ ...contract, weekly: e.target.value })} placeholder="e.g. 38" />
              </div>
              <div>
                <Label>Contract type</Label>
                <Select value={contract.contractType} onValueChange={v => setContract({ ...contract, contractType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full time</SelectItem>
                    <SelectItem value="part_time">Part time</SelectItem>
                    <SelectItem value="casual">Casual (guaranteed minimum)</SelectItem>
                    <SelectItem value="fixed_term">Fixed term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Minimum / week</Label>
                <Input type="number" step="0.5" value={contract.min}
                  onChange={e => setContract({ ...contract, min: e.target.value })} />
              </div>
              <div>
                <Label>Maximum / week</Label>
                <Input type="number" step="0.5" value={contract.max}
                  onChange={e => setContract({ ...contract, max: e.target.value })} />
              </div>
              <div>
                <Label>Averaging period (weeks)</Label>
                <Input type="number" value={contract.averagingPeriodWeeks}
                  onChange={e => setContract({ ...contract, averagingPeriodWeeks: e.target.value })} />
              </div>
              <div>
                <Label>Effective from</Label>
                <Input type="date" value={contract.effectiveDate}
                  onChange={e => setContract({ ...contract, effectiveDate: e.target.value })} />
              </div>
            </div>
          </FormSection>
        )}

        {action === 'export' && (
          <FormSection title="Export options">
            <Label>Format</Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
              </SelectContent>
            </Select>
          </FormSection>
        )}

        {(action === 'archive' || action === 'send-invitation') && (
          <p className="text-sm text-muted-foreground">
            No additional input required. Review the explanation above and confirm to proceed.
          </p>
        )}
      </div>
    </PrimaryOffCanvas>
  );
}
