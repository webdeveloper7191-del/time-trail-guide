import { useState } from 'react';
import { cn } from '@/lib/utils';
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
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { SelectWithCreate } from '@/components/ui/select-with-create';
import {
  MapPin, UserCog, Activity, Mail, DollarSign, CalendarDays,
  Archive, Clock, Send, FileClock, Download, Info, Plus, Trash2, LucideIcon, Briefcase,
  FileBadge, Percent, Lock, PencilLine,
} from 'lucide-react';
import { toast } from 'sonner';
import { locations, departments } from '@/data/mockStaffData';
import { mockPositions } from '@/data/mockPositions';
import { leaveTypeLabels, LeaveType } from '@/types/leaveAccrual';
import { employmentStatusLabels, streamOptions, employmentTypeLabels, EmploymentStatus } from '@/types/staff';

export type BulkActionKey =
  | 'add-locations'
  | 'set-role'
  | 'set-employment-details'
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
  'set-employment-details': {
    title: 'Set Employment Details',
    icon: Briefcase,
    explanation:
      'Update core employment metadata for the selected team members — status, start/end dates, and an internal comment. Use this to activate onboarded staff, terminate leavers or apply a common start date in bulk.',
    helper: 'End Date is required when Status is set to Terminated. Blank fields are ignored (existing values are preserved).',
    ctaLabel: 'Apply changes',
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

// Location -> areas tree (mock — replace with tenant data)
const LOCATION_AREAS: Record<string, string[]> = {
  'Melbourne CBD': ['Nursery', 'Toddler', 'Preschool', 'Kitchen'],
  'South Yarra': ['Room A', 'Room B', 'Outdoor Area'],
  'Prahran': ['Nursery', 'Kindy', 'Reception'],
  'Richmond': ['Room A', 'Room B', 'Room C', 'Kitchen'],
  'Fitzroy': ['Toddler', 'Preschool', 'Outdoor Area'],
};

interface BulkActionsPanelProps {
  open: boolean;
  action: BulkActionKey | null;
  selectedCount: number;
  onClose: () => void;
  onConfirm: (action: BulkActionKey) => void;
}

export function BulkActionsPanel({ open, action, selectedCount, onClose, onConfirm }: BulkActionsPanelProps) {
  // Simple shared state
  const [locationAreas, setLocationAreas] = useState<Record<string, string[]>>({});
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

  // Pay conditions — matches EditPayConditionsSheet 4-section structure
  const [customPositions, setCustomPositions] = useState<string[]>([]);
  const [pay, setPay] = useState({
    // Section 1 — Employment basis
    position: '',
    employmentType: 'full_time',
    fte: '1',
    guaranteedMinHours: '',
    casualLoading: '25',
    abn: '',
    payPeriod: 'fortnightly',
    effectiveDate: new Date().toISOString().slice(0, 10),
    // Section 2 — Instrument & classification
    instrumentType: 'modern_award',
    award: '',
    classification: '',
    stream: '',
    rateSource: 'award_resolved',
    baseRate: '',
    salaryAnnual: '',
    superRate: '11.5',
    // Section 3 — Ordinary hours & overtime
    ordinaryHoursPerDay: '8',
    ordinaryHoursPerWeek: '38',
    otAfterHoursPerDay: '8',
    otAfterHoursPerWeek: '38',
    otRate1: '1.5',
    otRate2: '2.0',
    // Section 4 — Loadings
    saturdayLoading: '1.25',
    sundayLoading: '1.75',
    publicHolidayLoading: '2.50',
    eveningLoading: '1.15',
  });
  // Per-field opt-in flags — only ticked fields get written to staff records
  const [payFlags, setPayFlags] = useState<Record<string, boolean>>({});
  const togglePayFlag = (k: string) => setPayFlags(p => ({ ...p, [k]: !p[k] }));
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

  // Employment details
  const [employment, setEmployment] = useState<{
    updateStatus: boolean; status: EmploymentStatus;
    updateStart: boolean; startDate: string;
    endDate: string;
    updateComment: boolean; comment: string;
  }>({
    updateStatus: false, status: 'active',
    updateStart: false, startDate: '',
    endDate: '',
    updateComment: false, comment: '',
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

        {action === 'add-locations' && (() => {
          const allLocs = Object.keys(LOCATION_AREAS);
          const totalAreas = allLocs.reduce((n, l) => n + LOCATION_AREAS[l].length, 0);
          const selectedAreas = Object.values(locationAreas).reduce((n, arr) => n + arr.length, 0);
          const allSelected = selectedAreas === totalAreas;

          const toggleAll = () => {
            if (allSelected) setLocationAreas({});
            else setLocationAreas(Object.fromEntries(allLocs.map(l => [l, [...LOCATION_AREAS[l]]])));
          };
          const toggleLoc = (loc: string) => {
            setLocationAreas(prev => {
              const next = { ...prev };
              const all = LOCATION_AREAS[loc];
              const cur = prev[loc] || [];
              if (cur.length === all.length) delete next[loc];
              else next[loc] = [...all];
              return next;
            });
          };
          const toggleArea = (loc: string, area: string) => {
            setLocationAreas(prev => {
              const cur = prev[loc] || [];
              const next = { ...prev };
              if (cur.includes(area)) {
                const filtered = cur.filter(a => a !== area);
                if (filtered.length === 0) delete next[loc];
                else next[loc] = filtered;
              } else {
                next[loc] = [...cur, area];
              }
              return next;
            });
          };

          return (
            <FormSection title="Locations & Areas">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">
                  Select whole locations, or expand to pick specific areas.
                </p>
                <Button size="sm" variant="outline" onClick={toggleAll}>
                  {allSelected ? 'Clear all' : 'Select all'}
                </Button>
              </div>

              <div className="rounded border border-border divide-y divide-border">
                {allLocs.map(loc => {
                  const areas = LOCATION_AREAS[loc];
                  const sel = locationAreas[loc] || [];
                  const state: 'none' | 'some' | 'all' =
                    sel.length === 0 ? 'none' : sel.length === areas.length ? 'all' : 'some';
                  return (
                    <div key={loc}>
                      <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40">
                        <Checkbox
                          checked={state === 'all' ? true : state === 'some' ? ('indeterminate' as unknown as boolean) : false}
                          onCheckedChange={() => toggleLoc(loc)}
                        />
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-sm font-medium">{loc}</span>
                          <span className="text-xs text-muted-foreground">
                            {sel.length}/{areas.length} areas
                          </span>
                        </div>
                      </label>
                      <div className="pl-10 pr-3 pb-2 space-y-1">
                        {areas.map(area => (
                          <label
                            key={area}
                            className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/40 cursor-pointer"
                          >
                            <Checkbox
                              checked={sel.includes(area)}
                              onCheckedChange={() => toggleArea(loc, area)}
                            />
                            <span className="text-sm text-muted-foreground">{area}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                {selectedAreas} area{selectedAreas === 1 ? '' : 's'} across{' '}
                {Object.keys(locationAreas).length} location
                {Object.keys(locationAreas).length === 1 ? '' : 's'} selected.
              </div>
            </FormSection>
          );
        })()}

        {action === 'set-employment-details' && (
          <FormSection title="Employment details to update">
            <p className="text-xs text-muted-foreground mb-2">
              Tick each field you want to overwrite. Unticked fields are left untouched on every selected team member.
            </p>

            {/* Status */}
            <div className="rounded border border-border p-3 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox checked={employment.updateStatus}
                  onCheckedChange={v => setEmployment({ ...employment, updateStatus: !!v })} />
                Employment Status
              </label>
              <Select value={employment.status} disabled={!employment.updateStatus}
                onValueChange={v => setEmployment({ ...employment, status: v as EmploymentStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(employmentStatusLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {employment.updateStatus && employment.status === 'terminated' && (
                <div>
                  <Label>Employment End Date *</Label>
                  <Input type="date" value={employment.endDate}
                    onChange={e => setEmployment({ ...employment, endDate: e.target.value })} />
                  <p className="text-xs text-muted-foreground mt-1">Required when terminating staff. Applied to every selected team member.</p>
                </div>
              )}
            </div>

            {/* Stream/Sector moved to Pay Conditions (Section 2 — Instrument & classification) */}

            {/* Start date */}
            <div className="rounded border border-border p-3 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox checked={employment.updateStart}
                  onCheckedChange={v => setEmployment({ ...employment, updateStart: !!v })} />
                Employment Start Date
              </label>
              <Input type="date" value={employment.startDate} disabled={!employment.updateStart}
                onChange={e => setEmployment({ ...employment, startDate: e.target.value })} />
              <p className="text-xs text-muted-foreground">Use for backdating migrated records or aligning cohorts to a common start date.</p>
            </div>

            {/* Internal comment */}
            <div className="rounded border border-border p-3 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox checked={employment.updateComment}
                  onCheckedChange={v => setEmployment({ ...employment, updateComment: !!v })} />
                Internal Comment / Note
              </label>
              <Textarea rows={4} value={employment.comment} disabled={!employment.updateComment}
                onChange={e => setEmployment({ ...employment, comment: e.target.value })}
                placeholder="Appended to each staff profile (admin/manager view only)." />
              <p className="text-xs text-muted-foreground">Appended to the existing note with a timestamp — existing comments are not overwritten.</p>
            </div>

            <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-900 dark:text-amber-200">
              Bulk changes are written with a single audit entry per staff member and can be reverted from the Audit Log within 24 hours.
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

        {action === 'set-pay-rates' && (() => {
          const isAwardBased = pay.instrumentType === 'modern_award' || pay.instrumentType === 'eba'
            || pay.instrumentType === 'ifa' || pay.instrumentType === 'over_award';
          const anyFlag = Object.values(payFlags).some(Boolean);

          // Field wrapper — opt-in checkbox drives whether change is applied in bulk
          const Field = ({ k, label, hint, children, span = 1 }: {
            k: string; label: string; hint?: string; children: React.ReactNode; span?: 1 | 2;
          }) => (
            <div className={cn('space-y-1.5', span === 2 && 'col-span-2')}>
              <label className="flex items-center gap-2 text-xs font-medium">
                <Checkbox checked={!!payFlags[k]} onCheckedChange={() => togglePayFlag(k)} />
                <span className={payFlags[k] ? '' : 'text-muted-foreground'}>{label}</span>
              </label>
              <div className={payFlags[k] ? '' : 'opacity-50 pointer-events-none'}>{children}</div>
              {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
            </div>
          );

          return (
            <>
              <div className="rounded-md bg-muted/30 border border-border/60 p-2.5 text-[11px] text-muted-foreground flex gap-2">
                <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                Tick only the fields you want to overwrite. Unticked fields are preserved on every selected team member.
                {!anyFlag && <span className="text-amber-600 font-medium">No fields selected yet.</span>}
              </div>

              <Accordion type="multiple" defaultValue={['s1', 's2']} className="space-y-2">

                {/* SECTION 1 — Employment basis */}
                <AccordionItem value="s1" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      1. Employment basis
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Field k="position" label="Position">
                        <SelectWithCreate
                          value={pay.position}
                          onValueChange={(v) => setPay({ ...pay, position: v })}
                          options={[
                            ...mockPositions.map((p) => ({ value: p.title, label: p.title })),
                            ...customPositions.map((p) => ({ value: p, label: p })),
                          ]}
                          onCreateNew={(np) => { setCustomPositions((prev) => [...prev, np]); setPay({ ...pay, position: np }); }}
                          placeholder="Select position"
                          createLabel="Create new position"
                        />
                      </Field>
                      <Field k="employmentType" label="Employment type">
                        <Select value={pay.employmentType} onValueChange={(v) => setPay({ ...pay, employmentType: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(employmentTypeLabels).map(([k, l]) => (
                              <SelectItem key={k} value={k}>{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      {pay.employmentType !== 'contractor' && (
                        <Field k="fte" label="FTE" hint="1.0 = full time. 0.5 = 50% of ordinary hours.">
                          <Input type="number" step="0.05" min={0} max={1} value={pay.fte}
                            onChange={(e) => setPay({ ...pay, fte: e.target.value })} />
                        </Field>
                      )}
                      {(pay.employmentType === 'part_time' || pay.employmentType === 'full_time') && (
                        <Field k="guaranteedMinHours" label="Guaranteed min hours / week">
                          <Input type="number" step="0.5" value={pay.guaranteedMinHours}
                            onChange={(e) => setPay({ ...pay, guaranteedMinHours: e.target.value })} />
                        </Field>
                      )}
                      {pay.employmentType === 'casual' && (
                        <Field k="casualLoading" label="Casual loading %">
                          <Input type="number" step="0.5" value={pay.casualLoading}
                            onChange={(e) => setPay({ ...pay, casualLoading: e.target.value })} />
                        </Field>
                      )}
                      {pay.employmentType === 'contractor' && (
                        <Field k="abn" label="ABN">
                          <Input value={pay.abn} onChange={(e) => setPay({ ...pay, abn: e.target.value })} placeholder="11 222 333 444" />
                        </Field>
                      )}
                      <Field k="payPeriod" label="Pay period">
                        <Select value={pay.payPeriod} onValueChange={(v) => setPay({ ...pay, payPeriod: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="fortnightly">Fortnightly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field k="effectiveDate" label="Effective from">
                        <Input type="date" value={pay.effectiveDate}
                          onChange={(e) => setPay({ ...pay, effectiveDate: e.target.value })} />
                      </Field>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* SECTION 2 — Industrial instrument & classification */}
                <AccordionItem value="s2" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileBadge className="h-4 w-4 text-muted-foreground" />
                      2. Industrial instrument & classification
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Field k="instrumentType" label="Instrument type">
                        <Select value={pay.instrumentType} onValueChange={(v) => setPay({ ...pay, instrumentType: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="modern_award">Modern Award</SelectItem>
                            <SelectItem value="eba">Enterprise Agreement (EBA)</SelectItem>
                            <SelectItem value="ifa">Individual Flexibility Agreement</SelectItem>
                            <SelectItem value="over_award">Over-award</SelectItem>
                            <SelectItem value="custom_hourly">Custom hourly rate</SelectItem>
                            <SelectItem value="annualised_salary">Annualised salary</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      {isAwardBased && (
                        <Field k="award" label="Industry award">
                          <Input value={pay.award} onChange={(e) => setPay({ ...pay, award: e.target.value })} placeholder="e.g. MA000120" />
                        </Field>
                      )}
                      {isAwardBased && (
                        <Field k="classification" label="Classification">
                          <Select value={pay.classification} onValueChange={(v) => setPay({ ...pay, classification: v })}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Level 3.1">Level 3.1 - Certificate III</SelectItem>
                              <SelectItem value="Level 3.2">Level 3.2 - Cert III (Experienced)</SelectItem>
                              <SelectItem value="Level 4.1">Level 4.1 - Diploma</SelectItem>
                              <SelectItem value="Level 4.2">Level 4.2 - Diploma (Experienced)</SelectItem>
                              <SelectItem value="Level 5.1">Level 5.1 - ECT</SelectItem>
                              <SelectItem value="Level 5.2">Level 5.2 - ECT (Experienced)</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                      )}
                      {isAwardBased && (
                        <Field k="stream" label="Stream / Sector" hint="Drives award grouping and classification defaults.">
                          <Select value={pay.stream} onValueChange={(v) => setPay({ ...pay, stream: v })}>
                            <SelectTrigger><SelectValue placeholder="Select stream" /></SelectTrigger>
                            <SelectContent>
                              {streamOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </Field>
                      )}
                    </div>

                    <Separator />

                    <Field k="rateSource" label="Rate source" span={2}>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { id: 'award_resolved', icon: Lock, title: 'Award-resolved', desc: 'Uses rate from classification.' },
                          { id: 'manual_hourly', icon: PencilLine, title: 'Custom hourly', desc: 'Set ordinary-time rate directly.' },
                          { id: 'annualised_salary', icon: DollarSign, title: 'Annualised salary', desc: 'Salary divided across ordinary hours.' },
                        ] as const).map((opt) => {
                          const IconC = opt.icon;
                          const on = pay.rateSource === opt.id;
                          return (
                            <button key={opt.id} type="button"
                              onClick={() => setPay({ ...pay, rateSource: opt.id })}
                              className={cn('text-left rounded-md border p-2.5 transition-colors',
                                on ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40')}>
                              <div className="flex items-center gap-1.5 text-xs font-medium mb-1">
                                <IconC className="h-3.5 w-3.5" />{opt.title}
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-tight">{opt.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      {pay.rateSource === 'manual_hourly' && (
                        <Field k="baseRate" label="Base hourly rate ($)">
                          <Input type="number" step="0.01" value={pay.baseRate}
                            onChange={(e) => setPay({ ...pay, baseRate: e.target.value })} placeholder="e.g. 32.50" />
                        </Field>
                      )}
                      {pay.rateSource === 'annualised_salary' && (
                        <Field k="salaryAnnual" label="Annual salary ($)">
                          <Input type="number" step="0.01" value={pay.salaryAnnual}
                            onChange={(e) => setPay({ ...pay, salaryAnnual: e.target.value })} placeholder="e.g. 78000" />
                        </Field>
                      )}
                      <Field k="superRate" label="Superannuation %">
                        <Input type="number" step="0.1" value={pay.superRate}
                          onChange={(e) => setPay({ ...pay, superRate: e.target.value })} />
                      </Field>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* SECTION 3 — Ordinary hours & overtime */}
                {pay.employmentType !== 'contractor' && (
                  <AccordionItem value="s3" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        3. Ordinary hours & overtime
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Field k="ordinaryHoursPerWeek" label="Ordinary hours / week">
                          <Input type="number" step="0.5" value={pay.ordinaryHoursPerWeek}
                            onChange={(e) => setPay({ ...pay, ordinaryHoursPerWeek: e.target.value })} />
                        </Field>
                        <Field k="ordinaryHoursPerDay" label="Ordinary hours / day">
                          <Input type="number" step="0.5" value={pay.ordinaryHoursPerDay}
                            onChange={(e) => setPay({ ...pay, ordinaryHoursPerDay: e.target.value })} />
                        </Field>
                        <Field k="otAfterHoursPerDay" label="OT after hrs / day">
                          <Input type="number" step="0.5" value={pay.otAfterHoursPerDay}
                            onChange={(e) => setPay({ ...pay, otAfterHoursPerDay: e.target.value })} />
                        </Field>
                        <Field k="otAfterHoursPerWeek" label="OT after hrs / week">
                          <Input type="number" step="0.5" value={pay.otAfterHoursPerWeek}
                            onChange={(e) => setPay({ ...pay, otAfterHoursPerWeek: e.target.value })} />
                        </Field>
                        <Field k="otRate1" label="First tier OT multiplier">
                          <Input type="number" step="0.01" value={pay.otRate1}
                            onChange={(e) => setPay({ ...pay, otRate1: e.target.value })} />
                        </Field>
                        <Field k="otRate2" label="Second tier OT multiplier">
                          <Input type="number" step="0.01" value={pay.otRate2}
                            onChange={(e) => setPay({ ...pay, otRate2: e.target.value })} />
                        </Field>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* SECTION 4 — Loadings & allowances */}
                {pay.employmentType !== 'contractor' && (
                  <AccordionItem value="s4" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        4. Loadings & allowances
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Field k="saturdayLoading" label="Saturday multiplier">
                          <Input type="number" step="0.01" value={pay.saturdayLoading}
                            onChange={(e) => setPay({ ...pay, saturdayLoading: e.target.value })} />
                        </Field>
                        <Field k="sundayLoading" label="Sunday multiplier">
                          <Input type="number" step="0.01" value={pay.sundayLoading}
                            onChange={(e) => setPay({ ...pay, sundayLoading: e.target.value })} />
                        </Field>
                        <Field k="publicHolidayLoading" label="Public holiday multiplier">
                          <Input type="number" step="0.01" value={pay.publicHolidayLoading}
                            onChange={(e) => setPay({ ...pay, publicHolidayLoading: e.target.value })} />
                        </Field>
                        <Field k="eveningLoading" label="Evening / afternoon multiplier">
                          <Input type="number" step="0.01" value={pay.eveningLoading}
                            onChange={(e) => setPay({ ...pay, eveningLoading: e.target.value })} />
                        </Field>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-medium">
                          <Checkbox checked={!!payFlags.allowances} onCheckedChange={() => togglePayFlag('allowances')} />
                          <span className={payFlags.allowances ? '' : 'text-muted-foreground'}>Allowances</span>
                        </label>
                        <div className={payFlags.allowances ? 'space-y-2' : 'space-y-2 opacity-50 pointer-events-none'}>
                          {allowances.map((a, idx) => (
                            <div key={idx} className="grid grid-cols-[1fr_120px_140px_36px] gap-2 items-end">
                              <div>{idx === 0 && <Label className="text-xs">Name</Label>}
                                <Input value={a.name}
                                  onChange={(e) => setAllowances(allowances.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} />
                              </div>
                              <div>{idx === 0 && <Label className="text-xs">Amount ($)</Label>}
                                <Input type="number" step="0.01" value={a.amount}
                                  onChange={(e) => setAllowances(allowances.map((x, i) => i === idx ? { ...x, amount: e.target.value } : x))} />
                              </div>
                              <div>{idx === 0 && <Label className="text-xs">Unit</Label>}
                                <Select value={a.unit}
                                  onValueChange={(v) => setAllowances(allowances.map((x, i) => i === idx ? { ...x, unit: v } : x))}>
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
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </>
          );
        })()}

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
