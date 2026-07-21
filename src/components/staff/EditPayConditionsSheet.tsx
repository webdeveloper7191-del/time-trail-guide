import { useMemo, useState } from 'react';
import { StaffMember, PayCondition, employmentTypeLabels, streamOptions } from '@/types/staff';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SelectWithCreate } from '@/components/ui/select-with-create';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DollarSign,
  Calendar as CalendarIcon,
  Save,
  X,
  Briefcase,
  FileBadge,
  Clock,
  Percent,
  Lock,
  PencilLine,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { mockPositions } from '@/data/mockPositions';
import { useSyncExternalStore } from 'react';
import { LeaveStore, subscribeLeave, getLeaveSnapshot, type LeaveKind } from '@/lib/leaveAccrualEngine';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollText } from 'lucide-react';

interface EditPayConditionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember;
  onSave?: (condition: PayCondition) => void;
}

type InstrumentType = 'modern_award' | 'eba' | 'ifa' | 'over_award' | 'custom_hourly' | 'annualised_salary';
type RateSource = 'award_resolved' | 'manual_hourly' | 'annualised_salary';

interface OverrideField<T> {
  override: boolean;
  value: T;
}

/**
 * Resolves the "award default" for a field based on the selected award/classification.
 * In production this would call the Awards engine. For now we simulate typical values
 * for the Children's Services Award family so the UI clearly shows read-only defaults
 * vs. manual overrides.
 */
function resolveAwardDefaults(award: string | undefined, classification: string | undefined) {
  // Baseline defaults (Children's Services Award-like)
  const base = {
    ordinaryHoursPerWeek: 38,
    ordinaryHoursPerDay: 7.6,
    rosterCycleWeeks: 1,
    minEngagementHours: 2,
    saturdayLoading: 25,
    sundayLoading: 50,
    publicHolidayLoading: 150,
    eveningLoading: 15,
    otAfterDaily: 7.6,
    otAfterWeekly: 38,
    otFirst2h: 150,
    otAfter2h: 200,
    otSaturday: 150,
    otSunday: 200,
    interaction: 'higher_of' as 'higher_of' | 'stack',
  };
  if (!award || award === 'None') {
    return { ...base, ordinaryHoursPerWeek: 38, otFirst2h: 150, otAfter2h: 150 };
  }
  return base;
}

const READONLY_INPUT_CLS =
  'bg-muted/40 border-dashed text-muted-foreground cursor-not-allowed';

// ── Currency input mask helpers ─────────────────────────────────────────────
function parseCurrencyInput(raw: string, maxDecimals: 0 | 2): number | null {
  if (raw == null) return 0;
  let s = String(raw).replace(/[^0-9.]/g, '');
  const firstDot = s.indexOf('.');
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
  }
  if (maxDecimals === 0) {
    s = s.replace(/\./g, '');
  } else if (firstDot !== -1) {
    const [int, dec = ''] = s.split('.');
    s = int + '.' + dec.slice(0, maxDecimals);
  }
  if (s === '' || s === '.') return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function formatHourlyDisplay(value: number, focused: boolean): string {
  if (!value) return '';
  if (focused) return String(value);
  return value.toLocaleString('en-AU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatSalaryDisplay(value: number, focused: boolean): string {
  if (!value) return '';
  const rounded = Math.round(value);
  if (focused) return String(rounded);
  return rounded.toLocaleString('en-AU', { maximumFractionDigits: 0 });
}


function FieldInfo({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-3 w-3 text-muted-foreground cursor-help inline-block ml-1" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[260px] text-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

function SectionHeaderInfo({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-muted cursor-help"
        >
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[320px] text-xs leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

function ResolvedField({
  label,
  value,
  unit,
  override,
  onToggleOverride,
  children,
  hint,
  error,
  warning,
  info,
  customizeMode = true,
}: {
  label: string;
  value: string | number;
  unit?: string;
  override: boolean;
  onToggleOverride: (v: boolean) => void;
  children: React.ReactNode;
  hint?: string;
  error?: string | null;
  warning?: string | null;
  info?: string;
  customizeMode?: boolean;
}) {
  const showOverrideEditor = customizeMode && override;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium flex items-center">
          {label}
          {info ? <FieldInfo text={info} /> : null}
        </Label>
        {customizeMode ? (
          <div className="flex items-center gap-1.5">
            {override ? (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] gap-1">
                <PencilLine className="h-2.5 w-2.5" /> Override
              </Badge>
            ) : (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] gap-1">
                <Lock className="h-2.5 w-2.5" /> From award
              </Badge>
            )}
            <Switch
              checked={override}
              onCheckedChange={onToggleOverride}
              className="scale-75 -mr-1"
            />
          </div>
        ) : override ? (
          <Badge variant="outline" className="h-5 px-1.5 text-[10px] gap-1">
            <PencilLine className="h-2.5 w-2.5" /> Override
          </Badge>
        ) : null}
      </div>
      {showOverrideEditor ? (
        <div className={cn(error && '[&_input]:border-destructive [&_button]:border-destructive')}>
          {children}
        </div>
      ) : (
        <div className={cn('flex items-center h-9 rounded-md border px-3 text-sm', READONLY_INPUT_CLS)}>
          {value}
          {unit ? <span className="ml-1 text-xs">{unit}</span> : null}
        </div>
      )}
      {error ? (
        <p className="text-[11px] text-destructive leading-snug flex items-start gap-1">
          <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          {error}
        </p>
      ) : warning ? (
        <p className="text-[11px] text-amber-600 leading-snug flex items-start gap-1">
          <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          {warning}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-muted-foreground leading-snug">{hint}</p>
      ) : null}
    </div>
  );
}

// Precedence explainer text used in section header tooltips
const PRECEDENCE = {
  s1: 'Employment basis is set per employee — not resolved from the award. It determines which downstream rules apply (leave entitlements, overtime, guaranteed hours).',
  s2: 'The industrial instrument selects the rule set. Rates flow: Award/EBA classification → optional Location policy → Staff override (custom hourly or annualised salary). Non-award rates must pass the Better Off Overall Test (BOOT).',
  s3: 'Ordinary hours and overtime thresholds resolve from the award by default. Location policies can tighten them; per-staff overrides only apply when Customize is on and must be more generous than the award (BOOT).',
  s4: 'Loadings and allowances resolve from the award. Location policies may add allowances (e.g. site-specific). Per-staff overrides may only raise loadings above the award minimum.',
  s5: 'RDO / ADO / TOIL rules (cycle length, accrual rates, TOIL expiry) are set centrally in Settings → Awards. This panel only opts this employee in and shows their live balance.',
};




export function EditPayConditionsSheet({ open, onOpenChange, staff, onSave }: EditPayConditionsSheetProps) {
  const payCondition = staff.currentPayCondition;

  // Section 1 — Employment basis
  const [effectiveFrom, setEffectiveFrom] = useState<Date>(
    payCondition?.effectiveFrom ? new Date(payCondition.effectiveFrom) : new Date()
  );
  const [effectiveTo, setEffectiveTo] = useState<Date | undefined>(
    payCondition?.effectiveTo ? new Date(payCondition.effectiveTo) : undefined
  );
  const [position, setPosition] = useState(payCondition?.position || '');
  const [customPositions, setCustomPositions] = useState<string[]>([]);
  const [employmentType, setEmploymentType] = useState(payCondition?.employmentType || 'full_time');
  const [fte, setFte] = useState<number>(1);
  const [guaranteedMinHours, setGuaranteedMinHours] = useState<number>(payCondition?.contractedHours || 0);

  // Shift-worker classification (drives NES 5th-week annual leave, 7-day span, night penalties)
  const [isShiftWorker, setIsShiftWorker] = useState<boolean>(!!payCondition?.isShiftWorker);
  const [isRotatingShiftWorker, setIsRotatingShiftWorker] = useState<boolean>(!!payCondition?.isRotatingShiftWorker);
  const [shiftPattern, setShiftPattern] = useState<NonNullable<PayCondition['shiftPattern']>>(
    payCondition?.shiftPattern || 'two_shift'
  );
  const [rotationCycleWeeks, setRotationCycleWeeks] = useState<number>(payCondition?.rotationCycleWeeks || 4);
  const [averageNightsPerCycle, setAverageNightsPerCycle] = useState<number>(payCondition?.averageNightsPerCycle || 0);

  // Section 2 — Industrial instrument & classification
  const [instrumentType, setInstrumentType] = useState<InstrumentType>('modern_award');
  const [industryAward, setIndustryAward] = useState(payCondition?.industryAward || '');
  const [classification, setClassification] = useState(payCondition?.classification || '');
  const [stream, setStream] = useState<string>((payCondition as any)?.stream || '');
  
  const [rateSource, setRateSource] = useState<RateSource>('award_resolved');
  const [manualHourlyRate, setManualHourlyRate] = useState<number>(payCondition?.hourlyRate || 0);
  const [annualSalary, setAnnualSalary] = useState<number>(payCondition?.annualSalary || 0);
  const [hourlyFocused, setHourlyFocused] = useState(false);
  const [salaryFocused, setSalaryFocused] = useState(false);
  const [payPeriod, setPayPeriod] = useState(payCondition?.payPeriod || 'fortnightly');
  const [superRate, setSuperRate] = useState<number>(11.5);
  const [casualLoading, setCasualLoading] = useState<number>(25);
  const [abn, setAbn] = useState<string>('');

  const awardDefaults = useMemo(
    () => resolveAwardDefaults(industryAward, classification),
    [industryAward, classification]
  );

  // Award-resolved base rate — simulated per classification
  const resolvedBaseRate = useMemo(() => {
    const map: Record<string, number> = {
      'Level 3.1': 26.14,
      'Level 3.2': 26.9,
      'Level 4.1': 29.42,
      'Level 4.2': 30.55,
      'Level 5.1': 34.8,
      'Level 5.2': 36.2,
    };
    return map[classification] || 26.14;
  }, [classification]);

  // Section 3 — Ordinary hours & overtime (per-field overrides)
  const [ordinaryPerWeek, setOrdinaryPerWeek] = useState<OverrideField<number>>({
    override: false,
    value: awardDefaults.ordinaryHoursPerWeek,
  });
  const [ordinaryPerDay, setOrdinaryPerDay] = useState<OverrideField<number>>({
    override: false,
    value: awardDefaults.ordinaryHoursPerDay,
  });
  const [rosterCycle, setRosterCycle] = useState<OverrideField<number>>({
    override: false,
    value: awardDefaults.rosterCycleWeeks,
  });
  const [otAfterDaily, setOtAfterDaily] = useState<OverrideField<number>>({
    override: false,
    value: awardDefaults.otAfterDaily,
  });
  const [otAfterWeekly, setOtAfterWeekly] = useState<OverrideField<number>>({
    override: false,
    value: awardDefaults.otAfterWeekly,
  });
  const [otFirst2h, setOtFirst2h] = useState<OverrideField<number>>({
    override: false,
    value: awardDefaults.otFirst2h,
  });
  const [otAfter2h, setOtAfter2h] = useState<OverrideField<number>>({
    override: false,
    value: awardDefaults.otAfter2h,
  });
  const [interaction, setInteraction] = useState<OverrideField<'higher_of' | 'stack'>>({
    override: false,
    value: awardDefaults.interaction,
  });

  // Section 4 — Loadings & allowances (award-resolved with overrides)
  const [saturdayLoading, setSaturdayLoading] = useState<OverrideField<number>>({
    override: false,
    value: awardDefaults.saturdayLoading,
  });
  const [sundayLoading, setSundayLoading] = useState<OverrideField<number>>({
    override: false,
    value: awardDefaults.sundayLoading,
  });
  const [phLoading, setPhLoading] = useState<OverrideField<number>>({
    override: false,
    value: awardDefaults.publicHolidayLoading,
  });
  const [eveningLoading, setEveningLoading] = useState<OverrideField<number>>({
    override: false,
    value: awardDefaults.eveningLoading,
  });
  const [selectedAllowances, setSelectedAllowances] = useState<string[]>([]);

  const availableAwardAllowances = [
    { id: 'first_aid', label: 'First Aid allowance', amount: 15.5, unit: 'per week' },
    { id: 'lead_educator', label: 'Lead educator allowance', amount: 0.55, unit: 'per hour' },
    { id: 'vehicle', label: 'Vehicle allowance', amount: 0.99, unit: 'per km' },
    { id: 'meal', label: 'Meal allowance', amount: 17.7, unit: 'per occasion' },
    { id: 'uniform', label: 'Uniform / laundry', amount: 6.25, unit: 'per week' },
  ];

  // Section-level "Customize" toggles — when off, override switches are hidden
  // and all values render read-only from the award/location resolution.
  const [customize, setCustomize] = useState<{ s3: boolean; s4: boolean }>({ s3: false, s4: false });
  const countOverrides = (fields: OverrideField<any>[]) => fields.filter((f) => f.override).length;
  const s3OverrideCount = countOverrides([ordinaryPerWeek, ordinaryPerDay, rosterCycle, otAfterDaily, otAfterWeekly, otFirst2h, otAfter2h, interaction]);
  const s4OverrideCount = countOverrides([saturdayLoading, sundayLoading, phLoading, eveningLoading]);



  const toggleAllowance = (id: string) =>
    setSelectedAllowances((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const isAwardBased =
    instrumentType !== 'custom_hourly' && instrumentType !== 'annualised_salary';

  const derivedHourlyFromSalary =
    annualSalary && ordinaryPerWeek.value
      ? annualSalary / (ordinaryPerWeek.value * 52)
      : 0;
  const effectiveHourlyRate =
    rateSource === 'manual_hourly'
      ? manualHourlyRate
      : rateSource === 'annualised_salary'
      ? derivedHourlyFromSalary
      : resolvedBaseRate;

  // Rate-source specific validation
  const rateErrors = useMemo(() => {
    const e: { manualHourlyRate?: string; annualSalary?: string } = {};
    if (rateSource === 'manual_hourly') {
      if (!manualHourlyRate || manualHourlyRate <= 0)
        e.manualHourlyRate = 'Custom hourly rate is required and must be greater than 0.';
      else if (!Number.isFinite(manualHourlyRate))
        e.manualHourlyRate = 'Enter a valid number (e.g. 32.50).';
      else if (manualHourlyRate > 1000)
        e.manualHourlyRate = 'Hourly rate looks unrealistic (max $1000/hr).';
      else if (!/^\d+(\.\d{1,2})?$/.test(String(manualHourlyRate)))
        e.manualHourlyRate = 'Use up to 2 decimal places (e.g. 32.50).';
    }
    if (rateSource === 'annualised_salary') {
      if (!annualSalary || annualSalary <= 0)
        e.annualSalary = 'Annualised salary is required and must be greater than 0.';
      else if (annualSalary < 20000)
        e.annualSalary = 'Salary must be at least $20,000 (below minimum wage otherwise).';
      else if (annualSalary > 2_000_000)
        e.annualSalary = 'Salary exceeds allowed maximum of $2,000,000.';
      else if (!Number.isInteger(annualSalary))
        e.annualSalary = 'Enter a whole dollar amount (no cents).';
    }
    return e;
  }, [rateSource, manualHourlyRate, annualSalary]);

  // ── Field-level validation against award limits (BOOT test) ───────────────
  // Rules:
  //  • Ordinary hours thresholds may only be LOWERED vs. award (more generous to employee).
  //  • Overtime kick-in thresholds may only be LOWERED (OT starts earlier, not later).
  //  • Overtime rates and loadings may only be RAISED (never pay less than award).
  //  • Hard bounds prevent nonsensical values.
  const validation = useMemo(() => {
    const errors: Record<string, string | null> = {};
    const warnings: Record<string, string | null> = {};

    // Ordinary hours / week
    if (ordinaryPerWeek.override) {
      if (ordinaryPerWeek.value < 1 || ordinaryPerWeek.value > 60)
        errors.ordinaryPerWeek = 'Must be between 1 and 60 hours.';
      else if (ordinaryPerWeek.value > awardDefaults.ordinaryHoursPerWeek)
        errors.ordinaryPerWeek = `Cannot exceed award limit of ${awardDefaults.ordinaryHoursPerWeek} hrs/wk (BOOT fail).`;
      else if (ordinaryPerWeek.value < awardDefaults.ordinaryHoursPerWeek - 8)
        warnings.ordinaryPerWeek = `Significantly below award (${awardDefaults.ordinaryHoursPerWeek} hrs). Confirm this matches the contract.`;
    }
    // Ordinary hours / day
    if (ordinaryPerDay.override) {
      if (ordinaryPerDay.value < 1 || ordinaryPerDay.value > 16)
        errors.ordinaryPerDay = 'Must be between 1 and 16 hours.';
      else if (ordinaryPerDay.value > awardDefaults.ordinaryHoursPerDay)
        errors.ordinaryPerDay = `Cannot exceed award limit of ${awardDefaults.ordinaryHoursPerDay} hrs/day.`;
    }
    // Roster cycle
    if (rosterCycle.override && (rosterCycle.value < 1 || rosterCycle.value > 8))
      errors.rosterCycle = 'Roster cycle must be 1–8 weeks.';
    // OT after daily
    if (otAfterDaily.override) {
      if (otAfterDaily.value < 1 || otAfterDaily.value > 16)
        errors.otAfterDaily = 'Must be between 1 and 16 hours.';
      else if (otAfterDaily.value > awardDefaults.otAfterDaily)
        errors.otAfterDaily = `OT must start at or before ${awardDefaults.otAfterDaily} hrs (award limit).`;
      else if (otAfterDaily.value < ordinaryPerDay.value)
        warnings.otAfterDaily = 'OT threshold is below ordinary hours/day — every day would incur overtime.';
    }
    // OT after weekly
    if (otAfterWeekly.override) {
      if (otAfterWeekly.value < 1 || otAfterWeekly.value > 80)
        errors.otAfterWeekly = 'Must be between 1 and 80 hours.';
      else if (otAfterWeekly.value > awardDefaults.otAfterWeekly)
        errors.otAfterWeekly = `Cannot exceed award weekly OT threshold of ${awardDefaults.otAfterWeekly} hrs.`;
      else if (otAfterWeekly.value < ordinaryPerWeek.value)
        errors.otAfterWeekly = 'Weekly OT threshold cannot be below ordinary hours/week.';
    }
    // OT rates — must be >= award
    if (otFirst2h.override) {
      if (otFirst2h.value < 100 || otFirst2h.value > 400)
        errors.otFirst2h = 'Rate must be between 100% and 400%.';
      else if (otFirst2h.value < awardDefaults.otFirst2h)
        errors.otFirst2h = `Cannot pay less than award rate of ${awardDefaults.otFirst2h}%.`;
    }
    if (otAfter2h.override) {
      if (otAfter2h.value < 100 || otAfter2h.value > 400)
        errors.otAfter2h = 'Rate must be between 100% and 400%.';
      else if (otAfter2h.value < awardDefaults.otAfter2h)
        errors.otAfter2h = `Cannot pay less than award rate of ${awardDefaults.otAfter2h}%.`;
    }
    // Loadings — must be >= award
    const loadingCheck = (
      key: string,
      field: OverrideField<number>,
      awardVal: number,
      label: string
    ) => {
      if (!field.override) return;
      if (field.value < 0 || field.value > 500) errors[key] = 'Must be between 0% and 500%.';
      else if (field.value < awardVal)
        errors[key] = `${label} cannot be less than award loading of ${awardVal}%.`;
    };
    loadingCheck('saturdayLoading', saturdayLoading, awardDefaults.saturdayLoading, 'Saturday loading');
    loadingCheck('sundayLoading', sundayLoading, awardDefaults.sundayLoading, 'Sunday loading');
    loadingCheck('phLoading', phLoading, awardDefaults.publicHolidayLoading, 'Public holiday loading');
    loadingCheck('eveningLoading', eveningLoading, awardDefaults.eveningLoading, 'Evening loading');

    return { errors, warnings, hasErrors: Object.values(errors).some(Boolean) };
  }, [
    awardDefaults, ordinaryPerWeek, ordinaryPerDay, rosterCycle,
    otAfterDaily, otAfterWeekly, otFirst2h, otAfter2h,
    saturdayLoading, sundayLoading, phLoading, eveningLoading,
  ]);

  const handleSave = () => {
    if (!position.trim()) {
      toast.error('Select a position before saving.');
      return;
    }
    if (validation.hasErrors) {
      toast.error('Please fix the highlighted validation errors before saving.');
      return;
    }
    if (Object.keys(rateErrors).length > 0) {
      toast.error(Object.values(rateErrors)[0] as string);
      return;
    }
    const updatedCondition: PayCondition = {
      id: payCondition?.id || `pay-${Date.now()}`,
      effectiveFrom: effectiveFrom.toISOString(),
      effectiveTo: effectiveTo?.toISOString(),
      position,
      employmentType: employmentType as PayCondition['employmentType'],
      payRateType:
        rateSource === 'annualised_salary'
          ? 'salary'
          : rateSource === 'award_resolved'
          ? 'award'
          : 'hourly',
      hourlyRate: effectiveHourlyRate,
      annualSalary: rateSource === 'annualised_salary' ? annualSalary : undefined,
      industryAward,
      classification,
      payPeriod: payPeriod as PayCondition['payPeriod'],
      contractedHours: ordinaryPerWeek.value,
      isShiftWorker,
      isRotatingShiftWorker,
      shiftPattern: isRotatingShiftWorker ? shiftPattern : undefined,
      rotationCycleWeeks: isRotatingShiftWorker ? rotationCycleWeeks : undefined,
      averageNightsPerCycle: isRotatingShiftWorker ? averageNightsPerCycle : undefined,
    };
    onSave?.(updatedCondition);
    toast.success('Pay conditions updated');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto p-0">
        <SheetHeader className="px-6 py-5 border-b bg-muted/20">
          <SheetTitle className="flex items-center gap-2 text-lg tracking-tight">
            <DollarSign className="h-5 w-5 text-primary" />
            Edit pay conditions
          </SheetTitle>
          <SheetDescription>
            {staff.firstName} {staff.lastName} · Values resolve in this order:{' '}
            <span className="font-medium text-foreground">Award → Location policy → Staff override</span>.
            Hover the <Info className="inline h-3 w-3 -mt-0.5" /> beside each section title to see how that
            section resolves.
          </SheetDescription>

        </SheetHeader>

        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Effective from<FieldInfo text="Date this pay condition set becomes active." /></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(effectiveFrom, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={effectiveFrom} onSelect={(d) => d && setEffectiveFrom(d)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Effective to (optional)<FieldInfo text="Optional end date. Leave blank for an ongoing condition." /></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {effectiveTo ? format(effectiveTo, 'PPP') : 'No end date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={effectiveTo} onSelect={setEffectiveTo} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <Accordion type="multiple" defaultValue={['s1', 's2', 's3', 's4']} className="space-y-3">
            {/* SECTION 1 — Employment basis */}
            <AccordionItem value="s1" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  1. Employment basis
                  <SectionHeaderInfo text={PRECEDENCE.s1} />
                </div>

              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Position<FieldInfo text="The employee's job title. Creates or selects from the positions master." /></Label>
                    <SelectWithCreate
                      value={position}
                      onValueChange={setPosition}
                      options={[
                        ...mockPositions.map((p) => ({ value: p.title, label: p.title })),
                        ...customPositions.map((p) => ({ value: p, label: p })),
                      ]}
                      onCreateNew={(newPos) => {
                        setCustomPositions((prev) => [...prev, newPos]);
                        setPosition(newPos);
                        toast.success(`Position "${newPos}" added to master`);
                      }}
                      placeholder="Select position"
                      createLabel="Create new position"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Employment type<FieldInfo text="Full-time, part-time, casual or contractor. Determines leave entitlements and overtime rules." /></Label>
                    <Select value={employmentType} onValueChange={(v) => setEmploymentType(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(employmentTypeLabels).map(([k, l]) => (
                          <SelectItem key={k} value={k}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Employment type context banner */}
                {employmentType === 'casual' && (
                  <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-2.5 text-[11px] text-amber-900 dark:text-amber-200 flex gap-2">
                    <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    Casual employees receive a casual loading in lieu of paid leave. No guaranteed minimum weekly hours apply.
                  </div>
                )}
                {employmentType === 'part_time' && (
                  <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-2.5 text-[11px] text-blue-900 dark:text-blue-200 flex gap-2">
                    <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    Part-time employees require agreed guaranteed hours per week. Additional hours may attract overtime.
                  </div>
                )}
                {employmentType === 'contractor' && (
                  <div className="rounded-md bg-muted/40 border border-dashed p-2.5 text-[11px] text-muted-foreground flex gap-2">
                    <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    Contractors are engaged under a commercial arrangement — no award, overtime, loadings or leave apply.
                  </div>
                )}

                <div className={cn('grid gap-4', employmentType === 'contractor' ? 'grid-cols-2' : 'grid-cols-3')}>
                  {employmentType !== 'contractor' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">FTE<FieldInfo text="Full Time Equivalent. 1.0 = full time. 0.5 = 50% of ordinary hours." /></Label>
                      <Input
                        type="number" step="0.05" min={0} max={1}
                        value={fte}
                        onChange={(e) => setFte(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  )}
                  {(employmentType === 'part_time' || employmentType === 'full_time') && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">
                        Guaranteed min hours / week
                        {employmentType === 'part_time' && (
                          <span className="ml-1 text-[10px] text-amber-600">required</span>
                        )}
                      </Label>
                      <Input
                        type="number" step="0.5"
                        value={guaranteedMinHours}
                        onChange={(e) => setGuaranteedMinHours(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  )}
                  {employmentType === 'casual' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Casual loading %<FieldInfo text="Loading paid in lieu of leave entitlements. Typically 25% under most modern awards." /></Label>
                      <Input
                        type="number" step="0.5"
                        value={casualLoading}
                        onChange={(e) => setCasualLoading(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  )}
                  {employmentType === 'contractor' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">ABN<FieldInfo text="Australian Business Number for the contracting entity." /></Label>
                      <Input value={abn} onChange={(e) => setAbn(e.target.value)} placeholder="11 222 333 444" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Pay period<FieldInfo text="How often the employee is paid." /></Label>
                    <Select value={payPeriod} onValueChange={(v) => setPayPeriod(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="fortnightly">Fortnightly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Shift worker classification */}
                {employmentType !== 'contractor' && (
                  <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="text-xs font-medium flex items-center">
                          Shift worker
                          <FieldInfo text="Under Fair Work NES s.87, a shift worker is regularly rostered over 7 days including Sundays and public holidays. Grants a 5th week of annual leave, 7-day span of ordinary hours, and eligibility for shift penalties (early morning, afternoon, night, permanent night)." />
                        </div>
                        <div className="text-[11px] text-muted-foreground">Adds 5th week annual leave (NES) · 7-day ordinary span · shift penalties apply</div>
                      </div>
                      <Switch
                        checked={isShiftWorker}
                        onCheckedChange={(v) => {
                          setIsShiftWorker(v);
                          if (!v) setIsRotatingShiftWorker(false);
                        }}
                      />
                    </div>

                    {isShiftWorker && (
                      <>
                        <div className="flex items-center justify-between gap-3 pt-2 border-t">
                          <div className="space-y-0.5">
                            <div className="text-xs font-medium flex items-center">
                              Rotating shift worker
                              <FieldInfo text="Employee rotates across two or more shifts (day/afternoon/night) on a repeating cycle. Enables rotating-shift loadings, restricts consecutive-night limits, and lets the roster engine spread nights fairly across the cycle." />
                            </div>
                            <div className="text-[11px] text-muted-foreground">Enables rotating loading · consecutive-night caps · cycle-based fairness</div>
                          </div>
                          <Switch
                            checked={isRotatingShiftWorker}
                            onCheckedChange={setIsRotatingShiftWorker}
                          />
                        </div>

                        {isRotatingShiftWorker && (
                          <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Rotation pattern<FieldInfo text="Which pattern this employee rotates through. Drives which penalty rates apply and which nights the roster engine may allocate." /></Label>
                              <Select value={shiftPattern} onValueChange={(v) => setShiftPattern(v as any)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="two_shift">Two-shift (day / afternoon)</SelectItem>
                                  <SelectItem value="three_shift">Three-shift (day / afternoon / night)</SelectItem>
                                  <SelectItem value="seven_day">7-day continuous</SelectItem>
                                  <SelectItem value="fixed_nights">Permanent night</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Rotation cycle (weeks)<FieldInfo text="Length of the repeating roster cycle. Fairness scoring balances night and weekend allocations across this window." /></Label>
                              <Input
                                type="number" min={1} max={12} step={1}
                                value={rotationCycleWeeks}
                                onChange={(e) => setRotationCycleWeeks(parseInt(e.target.value) || 1)}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Avg nights / cycle<FieldInfo text="Target average night shifts per cycle. The auto-scheduler uses this as the fairness target for this employee." /></Label>
                              <Input
                                type="number" min={0} step={0.5}
                                value={averageNightsPerCycle}
                                onChange={(e) => setAverageNightsPerCycle(parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </div>
                        )}

                        <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 px-3 py-2 text-[11px] text-blue-900 dark:text-blue-200 flex gap-2">
                          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          <span>
                            Annual leave accrual will use the <span className="font-medium">shift-worker rate (5 weeks / year)</span> instead of the standard 4 weeks. Saturday/Sunday penalties are replaced by shift-based penalties resolved from the award in Section 4.
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* SECTION 2 — Industrial instrument & classification */}
            <AccordionItem value="s2" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileBadge className="h-4 w-4 text-muted-foreground" />
                  2. Industrial instrument & classification
                  <SectionHeaderInfo text={PRECEDENCE.s2} />
                </div>

              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Instrument type<FieldInfo text="Legal pay instrument: Modern Award, Enterprise Agreement (EBA), IFA, or over-award." /></Label>
                    <Select
                      value={instrumentType}
                      onValueChange={(v) => {
                        const next = v as InstrumentType;
                        setInstrumentType(next);
                        if (next === 'custom_hourly') {
                          setRateSource('manual_hourly');
                          setIndustryAward('');
                          setClassification('');
                        } else if (next === 'annualised_salary') {
                          setRateSource('annualised_salary');
                          setIndustryAward('');
                          setClassification('');
                        } else {
                          setRateSource('award_resolved');
                        }
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modern_award">Modern Award</SelectItem>
                        <SelectItem value="eba">Enterprise Agreement (EBA)</SelectItem>
                        <SelectItem value="ifa">Individual Flexibility Arrangement (IFA)</SelectItem>
                        <SelectItem value="over_award">Over-award / Common law</SelectItem>
                        <SelectItem value="custom_hourly">Custom hourly rate</SelectItem>
                        <SelectItem value="annualised_salary">Annualised salary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {isAwardBased && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Industry award / instrument</Label>
                      <Select value={industryAward} onValueChange={setIndustryAward}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Children's Services Award 2010">Children's Services Award 2010</SelectItem>
                          <SelectItem value="Educational Services Award">Educational Services Award</SelectItem>
                          <SelectItem value="Social and Community Services">Social and Community Services</SelectItem>
                          <SelectItem value="None">None / Not applicable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                {isAwardBased ? (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Classification<FieldInfo text="Award classification level that sets the base pay rate and progression rules." /></Label>
                      <Select value={classification} onValueChange={setClassification}>
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
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Stream / Sector<FieldInfo text="Award stream or sector that governs the classification structure (e.g. SCHADS Social & Community stream)." /></Label>
                      <Select value={stream} onValueChange={setStream}>
                        <SelectTrigger><SelectValue placeholder="Select stream" /></SelectTrigger>
                        <SelectContent>
                          {streamOptions.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <div className="rounded-md bg-muted/40 border border-dashed p-2.5 text-[11px] text-muted-foreground flex gap-2">
                    <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    {instrumentType === 'custom_hourly'
                      ? 'Award and classification are not applicable when using a custom hourly rate. BOOT compliance remains the employer\'s responsibility.'
                      : 'Award and classification are not applicable for annualised salary arrangements. Ensure the salary satisfies BOOT across the full roster pattern.'}
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <Label className="text-xs">Rate source</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { id: 'award_resolved', icon: Lock, title: 'Award-resolved', desc: `Uses $${resolvedBaseRate.toFixed(2)}/hr from ${classification || 'classification'}.` },
                      { id: 'manual_hourly', icon: PencilLine, title: 'Custom hourly rate', desc: 'Set the ordinary-time rate directly (BOOT applies).' },
                      { id: 'annualised_salary', icon: DollarSign, title: 'Annualised salary', desc: 'Salary is divided across ordinary hours to derive an hourly equivalent.' },
                    ] as const).map((opt) => {
                      const Icon = opt.icon;
                      const active = rateSource === opt.id;
                      return (
                        <button
                          key={opt.id}

                          type="button"
                          onClick={() => setRateSource(opt.id)}
                          className={cn(
                            'text-left border rounded-md p-3 text-xs transition-colors',
                            active ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                          )}
                        >
                          <div className="flex items-center gap-1.5 font-medium">
                            <Icon className="h-3 w-3" /> {opt.title}
                          </div>
                          <p className="text-muted-foreground mt-1 leading-snug">{opt.desc}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Rate inputs — layout adapts to selected rate source */}
                  {rateSource === 'award_resolved' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Base hourly rate ($)<FieldInfo text="Resolved from the award classification." /></Label>
                        <div className={cn('flex items-center h-9 rounded-md border px-3 text-sm', READONLY_INPUT_CLS)}>
                          ${resolvedBaseRate.toFixed(2)}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Superannuation %<FieldInfo text="Employer contribution rate." /></Label>
                        <Input type="number" step="0.5" value={superRate} onChange={(e) => setSuperRate(parseFloat(e.target.value) || 0)} />
                      </div>
                    </div>
                  )}

                  {rateSource === 'manual_hourly' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Custom hourly rate<FieldInfo text="Must be equal to or greater than the award rate for BOOT compliance." /></Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">$</span>
                          <Input
                            type="text"
                            inputMode="decimal"
                            required
                            value={formatHourlyDisplay(manualHourlyRate, hourlyFocused)}
                            placeholder="0.00"
                            aria-invalid={!!rateErrors.manualHourlyRate}
                            className={cn('pl-6 pr-14 tabular-nums', rateErrors.manualHourlyRate && 'border-destructive focus-visible:ring-destructive')}
                            onFocus={() => setHourlyFocused(true)}
                            onBlur={() => {
                              setHourlyFocused(false);
                              setManualHourlyRate((v) => Math.round(v * 100) / 100);
                            }}
                            onChange={(e) => {
                              const parsed = parseCurrencyInput(e.target.value, 2);
                              if (parsed !== null) setManualHourlyRate(parsed);
                            }}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">/ hr</span>
                        </div>
                        {rateErrors.manualHourlyRate ? (
                          <p className="text-[11px] text-destructive flex items-start gap-1">
                            <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {rateErrors.manualHourlyRate}
                          </p>
                        ) : manualHourlyRate > 0 && isAwardBased && manualHourlyRate < resolvedBaseRate ? (
                          <p className="text-[11px] text-destructive flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Below award rate of ${resolvedBaseRate.toFixed(2)}/hr (BOOT fail).
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Superannuation %</Label>
                        <Input type="number" step="0.5" value={superRate} onChange={(e) => setSuperRate(parseFloat(e.target.value) || 0)} />
                      </div>
                    </div>
                  )}

                  {rateSource === 'annualised_salary' && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Annualised salary<FieldInfo text="Total annual base salary, exclusive of super. Whole dollars only." /></Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">$</span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            required
                            value={formatSalaryDisplay(annualSalary, salaryFocused)}
                            placeholder="0"
                            aria-invalid={!!rateErrors.annualSalary}
                            className={cn('pl-6 pr-14 tabular-nums', rateErrors.annualSalary && 'border-destructive focus-visible:ring-destructive')}
                            onFocus={() => setSalaryFocused(true)}
                            onBlur={() => {
                              setSalaryFocused(false);
                              setAnnualSalary((v) => Math.round(v));
                            }}
                            onChange={(e) => {
                              const parsed = parseCurrencyInput(e.target.value, 0);
                              if (parsed !== null) setAnnualSalary(parsed);
                            }}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">/ yr</span>
                        </div>
                        {rateErrors.annualSalary && (
                          <p className="text-[11px] text-destructive flex items-start gap-1">
                            <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {rateErrors.annualSalary}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Derived hourly equivalent</Label>
                        <div className={cn('flex items-center h-9 rounded-md border px-3 text-sm', READONLY_INPUT_CLS)}>
                          ${derivedHourlyFromSalary.toFixed(2)}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Salary ÷ ({ordinaryPerWeek.value} hrs × 52 wks)
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Superannuation %</Label>
                        <Input type="number" step="0.5" value={superRate} onChange={(e) => setSuperRate(parseFloat(e.target.value) || 0)} />
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* SECTION 3 — Ordinary hours & overtime (not applicable to contractors) */}
            {employmentType !== 'contractor' && (
            <AccordionItem value="s3" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  3. Ordinary hours & overtime
                  <SectionHeaderInfo text={PRECEDENCE.s3} />
                  {s3OverrideCount > 0 && (
                    <Badge variant="outline" className="ml-1 text-[10px] h-5 gap-1">
                      <PencilLine className="h-2.5 w-2.5" /> {s3OverrideCount} override{s3OverrideCount === 1 ? '' : 's'}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <div className="flex items-center justify-between rounded-md bg-muted/30 border border-dashed p-2.5 text-[11px] text-muted-foreground gap-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span>
                      Values shown are award defaults from {industryAward || 'the selected award'}. Turn on
                      <span className="font-medium text-foreground"> Customize</span> to override any field
                      (BOOT-tested at save).
                    </span>
                  </div>
                  <label className="flex items-center gap-2 shrink-0 cursor-pointer">
                    <span className="text-[11px] font-medium text-foreground">Customize</span>
                    <Switch checked={customize.s3} onCheckedChange={(v) => setCustomize((c) => ({ ...c, s3: v }))} className="scale-75" />
                  </label>
                </div>


                <div className="grid grid-cols-3 gap-4">
                  <ResolvedField
                    label="Ordinary hours / week"
                    value={ordinaryPerWeek.value}
                    unit="hrs"
                    override={ordinaryPerWeek.override}
                    onToggleOverride={(v) => setOrdinaryPerWeek({ ...ordinaryPerWeek, override: v })}                    customizeMode={customize.s3} info="Total standard hours before overtime applies. Award defaults prevent paying less than the legal minimum."
                    error={validation.errors.ordinaryPerWeek}
                    warning={validation.warnings.ordinaryPerWeek}
                  >
                    <Input
                      type="number" step="0.5"
                      value={ordinaryPerWeek.value}
                      onChange={(e) =>
                        setOrdinaryPerWeek({ override: true, value: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </ResolvedField>
                  <ResolvedField
                    label="Ordinary hours / day"
                    value={ordinaryPerDay.value}
                    unit="hrs"
                    override={ordinaryPerDay.override}
                    onToggleOverride={(v) => setOrdinaryPerDay({ ...ordinaryPerDay, override: v })}                    customizeMode={customize.s3} info="Daily threshold for ordinary time. Exceeding this triggers daily overtime penalties."
                    error={validation.errors.ordinaryPerDay}
                  >
                    <Input
                      type="number" step="0.25"
                      value={ordinaryPerDay.value}
                      onChange={(e) => setOrdinaryPerDay({ override: true, value: parseFloat(e.target.value) || 0 })}
                    />
                  </ResolvedField>
                  <ResolvedField
                    label="Roster cycle"
                    value={rosterCycle.value}
                    unit="weeks"
                    override={rosterCycle.override}
                    onToggleOverride={(v) => setRosterCycle({ ...rosterCycle, override: v })}                    customizeMode={customize.s3} info="How many weeks the repeating roster pattern covers (e.g., 1 = weekly, 2 = fortnightly)."
                    error={validation.errors.rosterCycle}
                  >
                    <Input
                      type="number" min={1}
                      value={rosterCycle.value}
                      onChange={(e) => setRosterCycle({ override: true, value: parseInt(e.target.value) || 1 })}
                    />
                  </ResolvedField>
                </div>



                <Separator />
                <div className="text-xs font-medium text-muted-foreground">Overtime thresholds</div>
                <div className="grid grid-cols-2 gap-4">
                  <ResolvedField
                    label="OT after (daily)"
                    value={otAfterDaily.value}
                    unit="hrs"
                    override={otAfterDaily.override}
                    onToggleOverride={(v) => setOtAfterDaily({ ...otAfterDaily, override: v })}                    customizeMode={customize.s3} info="Number of hours worked in a single day before overtime multipliers begin."
                    error={validation.errors.otAfterDaily}
                    warning={validation.warnings.otAfterDaily}
                  >
                    <Input
                      type="number" step="0.25"
                      value={otAfterDaily.value}
                      onChange={(e) => setOtAfterDaily({ override: true, value: parseFloat(e.target.value) || 0 })}
                    />
                  </ResolvedField>
                  <ResolvedField
                    label="OT after (weekly)"
                    value={otAfterWeekly.value}
                    unit="hrs"
                    override={otAfterWeekly.override}
                    onToggleOverride={(v) => setOtAfterWeekly({ ...otAfterWeekly, override: v })}                    customizeMode={customize.s3} info="Total weekly hours before overtime applies across the whole roster cycle."
                    error={validation.errors.otAfterWeekly}
                  >
                    <Input
                      type="number" step="0.5"
                      value={otAfterWeekly.value}
                      onChange={(e) => setOtAfterWeekly({ override: true, value: parseFloat(e.target.value) || 0 })}
                    />
                  </ResolvedField>
                  <ResolvedField
                    label="First 2 hours OT"
                    value={`${otFirst2h.value}%`}
                    override={otFirst2h.override}
                    onToggleOverride={(v) => setOtFirst2h({ ...otFirst2h, override: v })}                    customizeMode={customize.s3} info="Multiplier applied to the first 2 hours of overtime in a day or shift."
                    error={validation.errors.otFirst2h}
                  >
                    <Input
                      type="number"
                      value={otFirst2h.value}
                      onChange={(e) => setOtFirst2h({ override: true, value: parseFloat(e.target.value) || 0 })}
                    />
                  </ResolvedField>
                  <ResolvedField
                    label="After 2 hours OT"
                    value={`${otAfter2h.value}%`}
                    override={otAfter2h.override}
                    onToggleOverride={(v) => setOtAfter2h({ ...otAfter2h, override: v })}                    customizeMode={customize.s3} info="Multiplier applied after the first 2 hours of overtime (usually higher)."
                    error={validation.errors.otAfter2h}
                  >
                    <Input
                      type="number"
                      value={otAfter2h.value}
                      onChange={(e) => setOtAfter2h({ override: true, value: parseFloat(e.target.value) || 0 })}
                    />
                  </ResolvedField>
                </div>


                <ResolvedField
                  label="Overtime × penalty interaction"
                  value={interaction.value === 'higher_of' ? 'Higher of (do not stack)' : 'Stack (multiplicative)'}
                  override={interaction.override}
                  onToggleOverride={(v) => setInteraction({ ...interaction, override: v })}                  customizeMode={customize.s3} info="Choose whether weekend/PH penalties stack with overtime rates, or only the higher rate applies."
                  hint="Controls whether overtime multipliers and weekend/PH penalties compound or the higher rate wins."
                >
                  <Select
                    value={interaction.value}
                    onValueChange={(v) => setInteraction({ override: true, value: v as any })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="higher_of">Higher of (do not stack)</SelectItem>
                      <SelectItem value="stack">Stack (multiplicative)</SelectItem>
                    </SelectContent>
                  </Select>
                </ResolvedField>
              </AccordionContent>
            </AccordionItem>
            )}

            {/* SECTION 4 — Loadings & allowances (not applicable to contractors) */}
            {employmentType !== 'contractor' && (
            <AccordionItem value="s4" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  4. Loadings & allowances
                  <SectionHeaderInfo text={PRECEDENCE.s4} />
                  {s4OverrideCount > 0 && (
                    <Badge variant="outline" className="ml-1 text-[10px] h-5 gap-1">
                      <PencilLine className="h-2.5 w-2.5" /> {s4OverrideCount} override{s4OverrideCount === 1 ? '' : 's'}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <div className="flex items-center justify-between rounded-md bg-muted/30 border border-dashed p-2.5 text-[11px] text-muted-foreground gap-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span>Loadings shown are award defaults. Turn on <span className="font-medium text-foreground">Customize</span> to raise a rate above award (never below — BOOT).</span>
                  </div>
                  <label className="flex items-center gap-2 shrink-0 cursor-pointer">
                    <span className="text-[11px] font-medium text-foreground">Customize</span>
                    <Switch checked={customize.s4} onCheckedChange={(v) => setCustomize((c) => ({ ...c, s4: v }))} className="scale-75" />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">

                  <ResolvedField
                    label="Saturday loading"
                    value={`${saturdayLoading.value}%`}
                    override={saturdayLoading.override}
                    onToggleOverride={(v) => setSaturdayLoading({ ...saturdayLoading, override: v })}                    customizeMode={customize.s4} info="Percentage added to the base rate for hours worked on Saturday."
                    error={validation.errors.saturdayLoading}
                  >
                    <Input
                      type="number"
                      value={saturdayLoading.value}
                      onChange={(e) => setSaturdayLoading({ override: true, value: parseFloat(e.target.value) || 0 })}
                    />
                  </ResolvedField>
                  <ResolvedField
                    label="Sunday loading"
                    value={`${sundayLoading.value}%`}
                    override={sundayLoading.override}
                    onToggleOverride={(v) => setSundayLoading({ ...sundayLoading, override: v })}                    customizeMode={customize.s4} info="Percentage added to the base rate for hours worked on Sunday."
                    error={validation.errors.sundayLoading}
                  >
                    <Input
                      type="number"
                      value={sundayLoading.value}
                      onChange={(e) => setSundayLoading({ override: true, value: parseFloat(e.target.value) || 0 })}
                    />
                  </ResolvedField>
                  <ResolvedField
                    label="Public holiday loading"
                    value={`${phLoading.value}%`}
                    override={phLoading.override}
                    onToggleOverride={(v) => setPhLoading({ ...phLoading, override: v })}                    customizeMode={customize.s4} info="Percentage added to the base rate for hours worked on a public holiday."
                    error={validation.errors.phLoading}
                  >
                    <Input
                      type="number"
                      value={phLoading.value}
                      onChange={(e) => setPhLoading({ override: true, value: parseFloat(e.target.value) || 0 })}
                    />
                  </ResolvedField>
                  <ResolvedField
                    label="Evening loading"
                    value={`${eveningLoading.value}%`}
                    override={eveningLoading.override}
                    onToggleOverride={(v) => setEveningLoading({ ...eveningLoading, override: v })}                    customizeMode={customize.s4} info="Percentage added to the base rate for hours worked during the evening period."
                    error={validation.errors.eveningLoading}
                  >
                    <Input
                      type="number"
                      value={eveningLoading.value}
                      onChange={(e) => setEveningLoading({ override: true, value: parseFloat(e.target.value) || 0 })}
                    />
                  </ResolvedField>

                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Award allowances applicable to this employee</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        {selectedAllowances.length} selected
                      </span>
                      {selectedAllowances.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedAllowances([])}
                          className="text-[11px] text-muted-foreground hover:text-foreground underline"
                        >
                          Clear
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedAllowances(availableAwardAllowances.map((a) => a.id))}
                        className="text-[11px] text-muted-foreground hover:text-foreground underline"
                      >
                        Select all
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Tick every allowance that applies. All ticked allowances are automatically added when timesheets are processed.
                  </p>

                  {selectedAllowances.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedAllowances.map((id) => {
                        const a = availableAwardAllowances.find((x) => x.id === id);
                        if (!a) return null;
                        return (
                          <Badge key={id} variant="secondary" className="gap-1 h-6 pr-1">
                            {a.label}
                            <button
                              type="button"
                              onClick={() => toggleAllowance(id)}
                              className="ml-0.5 rounded hover:bg-muted p-0.5"
                              aria-label={`Remove ${a.label}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                  <div className="border rounded-md divide-y">
                    {availableAwardAllowances.map((a) => {
                      const on = selectedAllowances.includes(a.id);
                      return (
                        <label
                          key={a.id}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-muted/30',
                            on && 'bg-primary/5'
                          )}
                        >
                          <Checkbox
                            checked={on}
                            onCheckedChange={() => toggleAllowance(a.id)}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{a.label}</div>
                            <div className="text-[11px] text-muted-foreground">
                              ${a.amount.toFixed(2)} {a.unit}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            )}

            {/* Section 5 · Is RDO/ADO/TOIL Applicable? */}
            <AccordionItem value="s5" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">5. Is RDO/ADO/TOIL Applicable?</span>
                  <Badge variant="outline" className="ml-2 text-[10px]">RDO · ADO · TOIL</Badge>
                  <SectionHeaderInfo text={PRECEDENCE.s5} />
                </div>

              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <StaffLeaveAccrualEditor staffId={staff.id} staffName={`${staff.firstName} ${staff.lastName}`} />
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t px-6 py-3 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {validation.hasErrors ? (
              <span className="text-destructive flex items-center gap-1 font-medium">
                <AlertTriangle className="h-3.5 w-3.5" />
                {Object.values(validation.errors).filter(Boolean).length} validation issue(s) to fix
              </span>
            ) : (
              <>
                Effective hourly rate: <span className="font-semibold text-foreground">${effectiveHourlyRate.toFixed(2)}</span>
                <span className="mx-2">·</span>
                Ordinary hrs/wk: <span className="font-semibold text-foreground">{ordinaryPerWeek.value}</span>
                {isShiftWorker && (
                  <>
                    <span className="mx-2">·</span>
                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                      {isRotatingShiftWorker ? 'Rotating shift worker' : 'Shift worker'}
                    </Badge>
                  </>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />Cancel
            </Button>
            <Button onClick={handleSave} disabled={validation.hasErrors}>
              <Save className="h-4 w-4 mr-2" />Save changes
            </Button>
          </div>
        </div>

      </SheetContent>
    </Sheet>
  );
}

// ---------- Inline RDO / ADO / TOIL editor ----------

const LEAVE_META: Record<LeaveKind, { label: string; hue: string; blurb: string }> = {
  RDO:  { label: 'RDO', hue: 'bg-blue-50 text-blue-700 border-blue-200',       blurb: 'Rostered Day Off — fixed cyclical day funded by longer ordinary weeks.' },
  ADO:  { label: 'ADO', hue: 'bg-emerald-50 text-emerald-700 border-emerald-200', blurb: 'Accrued Day Off — banked per ordinary hour, taken as full-day blocks.' },
  TOIL: { label: 'TOIL', hue: 'bg-violet-50 text-violet-700 border-violet-200', blurb: 'Time Off In Lieu — overtime converted to leave instead of paid out.' },
};

function StaffLeaveAccrualEditor({ staffId, staffName }: { staffId: string; staffName: string }) {
  const snap = useSyncExternalStore(subscribeLeave, getLeaveSnapshot, getLeaveSnapshot);
  const cfg = snap.staff.find(s => s.staffId === staffId);
  const optedIn = cfg?.optedIn  ?? { RDO: false, ADO: false, TOIL: false };
  const balance = cfg?.balanceHours ?? { RDO: 0, ADO: 0, TOIL: 0 };

  const toggle = (k: LeaveKind, v: boolean) => {
    LeaveStore.updateStaffConfig(staffId, { staffName, optedIn: { ...optedIn, [k]: v } });
  };
  const setAnchor = (d?: string) => LeaveStore.updateStaffConfig(staffId, { staffName, rdoAnchorDate: d });

  const [adjKind, setAdjKind] = useState<LeaveKind>('TOIL');
  const [adjHours, setAdjHours] = useState<string>('');
  const [adjNote, setAdjNote]   = useState<string>('');
  const applyAdjustment = () => {
    const n = Number(adjHours);
    if (!n || Number.isNaN(n)) { toast.error('Enter a non-zero hour value (use – for deductions)'); return; }
    LeaveStore.postLedger({
      staffId, kind: adjKind, type: 'adjustment', hours: n,
      occurredOn: new Date().toISOString().slice(0, 10),
      note: adjNote || `Manual adjustment via pay conditions`,
    });
    setAdjHours(''); setAdjNote('');
    toast.success(`${n >= 0 ? 'Credited' : 'Debited'} ${Math.abs(n).toFixed(2)}h ${adjKind}`);
  };

  const staffLedger = snap.ledger.filter(e => e.staffId === staffId).slice(-6).reverse();

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground">
        Opt this employee into each leave scheme and see live balances. Award-level rules (cycle length, accrual
        rates, TOIL expiry) are configured centrally in <span className="font-medium text-foreground">Settings → Awards → RDO / ADO / TOIL</span>.
      </div>

      {/* Opt-in cards */}
      <div className="grid gap-3 md:grid-cols-3">
        {(['RDO', 'ADO', 'TOIL'] as LeaveKind[]).map(k => (
          <div key={k} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={LEAVE_META[k].hue}>{LEAVE_META[k].label}</Badge>
              <Switch checked={optedIn[k]} onCheckedChange={(v) => toggle(k, v)} />
            </div>
            <div className="text-[11px] text-muted-foreground leading-relaxed">{LEAVE_META[k].blurb}</div>
            <div className="flex items-center justify-between text-xs pt-1 border-t">
              <span className="text-muted-foreground">Current balance</span>
              <span className="font-mono font-semibold">{balance[k].toFixed(2)} h</span>
            </div>
          </div>
        ))}
      </div>

      {/* Golden rule callout */}
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900 leading-relaxed">
        <span className="font-semibold">System rule:</span> RDO and ADO never accrue from overtime. TOIL never
        accrues from ordinary hours. Balances are kept separate because accrual, approval, payout and
        compliance rules differ per scheme.
      </div>

      {/* Per-scheme configuration */}
      {optedIn.RDO && (
        <div className="rounded-lg border p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={LEAVE_META.RDO.hue}>RDO</Badge>
            <span className="text-sm font-medium">Rostered Day Off arrangement</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            Example: 38-hr week worked as 40 hrs; the extra 2 hrs/week fund one RDO every 4 weeks.
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <Label className="text-[11px]">Anchor date</Label>
              <Input type="date" className="h-9"
                value={cfg?.rdoAnchorDate ?? ''}
                onChange={(e) => setAnchor(e.target.value || undefined)} />
            </div>
            <div>
              <Label className="text-[11px]">Preferred day</Label>
              <Select
                value={cfg?.rdoSettings?.dayOfWeek ?? ''}
                onValueChange={(v) => LeaveStore.updateStaffConfig(staffId, { staffName, rdoSettings: { ...cfg?.rdoSettings, dayOfWeek: v as 'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun' } })}>
                <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {['mon','tue','wed','thu','fri','sat','sun'].map(d => (
                    <SelectItem key={d} value={d}>{d.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px]">Cycle (weeks)</Label>
              <Input type="number" min={1} max={12} className="h-9"
                value={cfg?.rdoSettings?.cycleWeeks ?? ''}
                placeholder="4"
                onChange={(e) => LeaveStore.updateStaffConfig(staffId, { staffName, rdoSettings: { ...cfg?.rdoSettings, cycleWeeks: Number(e.target.value) || undefined } })} />
            </div>
            <div>
              <Label className="text-[11px]">Extra mins / day</Label>
              <Input type="number" min={0} className="h-9"
                value={cfg?.rdoSettings?.extraMinutesPerDay ?? ''}
                placeholder="24"
                onChange={(e) => LeaveStore.updateStaffConfig(staffId, { staffName, rdoSettings: { ...cfg?.rdoSettings, extraMinutesPerDay: Number(e.target.value) || undefined } })} />
            </div>
          </div>
        </div>
      )}

      {optedIn.ADO && (
        <div className="rounded-lg border p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={LEAVE_META.ADO.hue}>ADO</Badge>
            <span className="text-sm font-medium">Accrued Day Off — progressive banking</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            Example: 7h 36m ordinary + 24 extra ordinary mins/day accrue until enough hours fund a paid day off.
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div>
              <Label className="text-[11px]">Extra ordinary mins / day</Label>
              <Input type="number" min={0} className="h-9"
                value={cfg?.adoSettings?.extraMinutesPerDay ?? ''}
                placeholder="24"
                onChange={(e) => LeaveStore.updateStaffConfig(staffId, { staffName, adoSettings: { ...cfg?.adoSettings, extraMinutesPerDay: Number(e.target.value) || undefined } })} />
            </div>
            <div>
              <Label className="text-[11px]">Hours per day off</Label>
              <Input type="number" step="0.1" min={0} className="h-9"
                value={cfg?.adoSettings?.targetHoursPerDayOff ?? ''}
                placeholder="7.6"
                onChange={(e) => LeaveStore.updateStaffConfig(staffId, { staffName, adoSettings: { ...cfg?.adoSettings, targetHoursPerDayOff: Number(e.target.value) || undefined } })} />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-[11px]">Auto-schedule day off</Label>
                <div className="text-[10px] text-muted-foreground">Book once threshold hit.</div>
              </div>
              <Switch
                checked={!!cfg?.adoSettings?.autoScheduleDayOff}
                onCheckedChange={(v) => LeaveStore.updateStaffConfig(staffId, { staffName, adoSettings: { ...cfg?.adoSettings, autoScheduleDayOff: v } })} />
            </div>
          </div>
        </div>
      )}

      {optedIn.TOIL && (
        <div className="rounded-lg border p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={LEAVE_META.TOIL.hue}>TOIL</Badge>
            <span className="text-sm font-medium">Time Off In Lieu — overtime conversion</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            Example: 2 hrs of eligible OT convert to either 2 hrs TOIL (time-for-time) or 3 hrs (penalty-equivalent @ 150%).
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <Label className="text-[11px]">Conversion</Label>
              <Select
                value={cfg?.toilSettings?.conversion ?? 'time_for_time'}
                onValueChange={(v) => LeaveStore.updateStaffConfig(staffId, { staffName, toilSettings: { ...cfg?.toilSettings, conversion: v as 'time_for_time' | 'penalty_equivalent' } })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="time_for_time">Time-for-time</SelectItem>
                  <SelectItem value="penalty_equivalent">Penalty-equivalent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {cfg?.toilSettings?.conversion === 'penalty_equivalent' && (
              <div>
                <Label className="text-[11px]">Multiplier</Label>
                <Input type="number" step="0.1" min={1} className="h-9"
                  value={cfg?.toilSettings?.penaltyMultiplier ?? ''}
                  placeholder="1.5"
                  onChange={(e) => LeaveStore.updateStaffConfig(staffId, { staffName, toilSettings: { ...cfg?.toilSettings, penaltyMultiplier: Number(e.target.value) || undefined } })} />
              </div>
            )}
            <div>
              <Label className="text-[11px]">Max balance (hrs)</Label>
              <Input type="number" min={0} className="h-9"
                value={cfg?.toilSettings?.maxBalanceHours ?? ''}
                placeholder="40"
                onChange={(e) => LeaveStore.updateStaffConfig(staffId, { staffName, toilSettings: { ...cfg?.toilSettings, maxBalanceHours: Number(e.target.value) || undefined } })} />
            </div>
            <div>
              <Label className="text-[11px]">Expiry (days)</Label>
              <Input type="number" min={0} className="h-9"
                value={cfg?.toilSettings?.expiryDays ?? ''}
                placeholder="90"
                onChange={(e) => LeaveStore.updateStaffConfig(staffId, { staffName, toilSettings: { ...cfg?.toilSettings, expiryDays: Number(e.target.value) || undefined } })} />
            </div>
            <div className="flex items-end gap-2 md:col-span-2">
              <div className="flex-1">
                <Label className="text-[11px]">Pre-approval required</Label>
                <div className="text-[10px] text-muted-foreground">Manager must approve before OT converts.</div>
              </div>
              <Switch
                checked={!!cfg?.toilSettings?.requiresPreApproval}
                onCheckedChange={(v) => LeaveStore.updateStaffConfig(staffId, { staffName, toilSettings: { ...cfg?.toilSettings, requiresPreApproval: v } })} />
            </div>
          </div>
        </div>
      )}


      {/* Manual adjustment */}
      <div className="rounded-lg border p-3 space-y-2">
        <div className="flex items-center gap-2">
          <PencilLine className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">Manual balance adjustment</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[120px_120px_1fr_auto] gap-2">
          <Select value={adjKind} onValueChange={(v) => setAdjKind(v as LeaveKind)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="RDO">RDO</SelectItem>
              <SelectItem value="ADO">ADO</SelectItem>
              <SelectItem value="TOIL">TOIL</SelectItem>
            </SelectContent>
          </Select>
          <Input type="number" step="0.25" placeholder="± hours" value={adjHours} onChange={(e) => setAdjHours(e.target.value)} className="h-9" />
          <Input placeholder="Reason / note (optional)" value={adjNote} onChange={(e) => setAdjNote(e.target.value)} className="h-9" />
          <Button size="sm" onClick={applyAdjustment}>Post</Button>
        </div>
        <div className="text-[11px] text-muted-foreground">Use a negative number to debit (e.g. –4 for 4 hours consumed).</div>
      </div>

      {/* Recent activity */}
      <div className="rounded-lg border">
        <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
          <ScrollText className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">Recent ledger activity</span>
          <span className="text-[10px] text-muted-foreground ml-auto">Last 6 entries</span>
        </div>
        {staffLedger.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">No ledger entries yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-8 text-[11px]">Date</TableHead>
                <TableHead className="h-8 text-[11px]">Kind</TableHead>
                <TableHead className="h-8 text-[11px]">Type</TableHead>
                <TableHead className="h-8 text-[11px] text-right">Hours</TableHead>
                <TableHead className="h-8 text-[11px]">Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffLedger.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="py-1.5 text-xs">{e.occurredOn}</TableCell>
                  <TableCell className="py-1.5"><Badge variant="outline" className={LEAVE_META[e.kind].hue}>{e.kind}</Badge></TableCell>
                  <TableCell className="py-1.5 text-xs capitalize">{e.type}</TableCell>
                  <TableCell className={`py-1.5 text-right font-mono text-xs ${e.hours >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {e.hours > 0 ? '+' : ''}{e.hours.toFixed(2)}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs text-muted-foreground truncate max-w-[200px]">{e.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
