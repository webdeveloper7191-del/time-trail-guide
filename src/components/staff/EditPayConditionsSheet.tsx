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
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium flex items-center">
          {label}
          {info ? <FieldInfo text={info} /> : null}
        </Label>
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
      </div>
      {override ? (
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
            {staff.firstName} {staff.lastName} · Fields marked{' '}
            <span className="inline-flex items-center gap-1 mx-0.5">
              <Lock className="h-3 w-3" /> From award
            </span>{' '}
            are resolved from the industrial instrument. Toggle any field to override.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 py-4">
          <Accordion type="multiple" defaultValue={['s1', 's2', 's3', 's4']} className="space-y-3">
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
                <div className="grid grid-cols-2 gap-4">
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
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <div className="rounded-md bg-muted/30 border border-dashed p-2.5 text-[11px] text-muted-foreground flex gap-2">
                  <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  Award-resolved values reflect {industryAward || 'the selected award'}. Overrides require a
                  documented reason and are BOOT-tested at save time.
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <ResolvedField
                    label="Ordinary hours / week"
                    value={ordinaryPerWeek.value}
                    unit="hrs"
                    override={ordinaryPerWeek.override}
                    onToggleOverride={(v) => setOrdinaryPerWeek({ ...ordinaryPerWeek, override: v })}                    info="Total standard hours before overtime applies. Award defaults prevent paying less than the legal minimum."
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
                    onToggleOverride={(v) => setOrdinaryPerDay({ ...ordinaryPerDay, override: v })}                    info="Daily threshold for ordinary time. Exceeding this triggers daily overtime penalties."
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
                    onToggleOverride={(v) => setRosterCycle({ ...rosterCycle, override: v })}                    info="How many weeks the repeating roster pattern covers (e.g., 1 = weekly, 2 = fortnightly)."
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
                    onToggleOverride={(v) => setOtAfterDaily({ ...otAfterDaily, override: v })}                    info="Number of hours worked in a single day before overtime multipliers begin."
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
                    onToggleOverride={(v) => setOtAfterWeekly({ ...otAfterWeekly, override: v })}                    info="Total weekly hours before overtime applies across the whole roster cycle."
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
                    onToggleOverride={(v) => setOtFirst2h({ ...otFirst2h, override: v })}                    info="Multiplier applied to the first 2 hours of overtime in a day or shift."
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
                    onToggleOverride={(v) => setOtAfter2h({ ...otAfter2h, override: v })}                    info="Multiplier applied after the first 2 hours of overtime (usually higher)."
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
                  onToggleOverride={(v) => setInteraction({ ...interaction, override: v })}                  info="Choose whether weekend/PH penalties stack with overtime rates, or only the higher rate applies."
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
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <ResolvedField
                    label="Saturday loading"
                    value={`${saturdayLoading.value}%`}
                    override={saturdayLoading.override}
                    onToggleOverride={(v) => setSaturdayLoading({ ...saturdayLoading, override: v })}                    info="Percentage added to the base rate for hours worked on Saturday."
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
                    onToggleOverride={(v) => setSundayLoading({ ...sundayLoading, override: v })}                    info="Percentage added to the base rate for hours worked on Sunday."
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
                    onToggleOverride={(v) => setPhLoading({ ...phLoading, override: v })}                    info="Percentage added to the base rate for hours worked on a public holiday."
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
                    onToggleOverride={(v) => setEveningLoading({ ...eveningLoading, override: v })}                    info="Percentage added to the base rate for hours worked during the evening period."
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
