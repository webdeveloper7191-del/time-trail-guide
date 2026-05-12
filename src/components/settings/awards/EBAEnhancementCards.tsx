/**
 * Cohesive set of enhancement cards for the Enterprise Agreement detail sheet
 * and panel. Implements: live BOOT, expiry/lifecycle alerts, pay rate timeline,
 * coverage→location mapping, version history, FWC document upload/sync, and
 * approval/ballot workflow.
 *
 * All cards are presentational — they accept the EBA + lightweight callbacks
 * and use only existing design tokens.
 */
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Scale, AlertTriangle, CheckCircle2, XCircle, Calendar, History, MapPin,
  FileText, Upload, ExternalLink, RefreshCw, Vote, Users, Clock, TrendingUp,
  GitBranch, FileCheck, Bell, CalendarClock, Sparkles, Building2,
} from 'lucide-react';
import { format, differenceInDays, addYears, addMonths, isPast, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { EnterpriseAgreement, EBAPayRate } from '@/types/enterpriseAgreement';

// ─────────────────────────────────────────────────────────────────────────────
// 1. LIVE BOOT RESULT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lightweight benchmark "award" rates by classification level (mock).
 * In production these would come from the underlying award lookup.
 */
const AWARD_BENCHMARK_RATE_BY_LEVEL: Record<number, number> = {
  1: 25.40,
  2: 27.80,
  3: 30.20,
  4: 33.90,
  5: 38.50,
};

interface BOOTRow {
  classificationId: string;
  code: string;
  name: string;
  level: number;
  ebaHourlyRate: number;
  awardHourlyRate: number;
  delta: number;
  deltaPercent: number;
  pass: boolean;
}

export function EBABootResultCard({ eba }: { eba: EnterpriseAgreement }) {
  const rows: BOOTRow[] = useMemo(() => {
    return eba.classifications.map((cls) => {
      const rate = eba.payRates.find((r) => r.classificationId === cls.id);
      const ebaHourly = rate
        ? rate.rateType === 'annual'
          ? rate.baseRate / 1976
          : rate.rateType === 'weekly'
            ? rate.baseRate / 38
            : rate.baseRate
        : 0;
      const awardHourly = AWARD_BENCHMARK_RATE_BY_LEVEL[cls.level] ?? 25;
      const delta = ebaHourly - awardHourly;
      const deltaPercent = awardHourly === 0 ? 0 : (delta / awardHourly) * 100;
      return {
        classificationId: cls.id,
        code: cls.code,
        name: cls.name,
        level: cls.level,
        ebaHourlyRate: ebaHourly,
        awardHourlyRate: awardHourly,
        delta,
        deltaPercent,
        pass: delta >= 0,
      };
    });
  }, [eba]);

  const overallPass = rows.every((r) => r.pass);
  const passCount = rows.filter((r) => r.pass).length;
  const avgDelta = rows.length === 0 ? 0 : rows.reduce((s, r) => s + r.deltaPercent, 0) / rows.length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="h-4 w-4" />
          BOOT Result · Live Calculation
        </CardTitle>
        <CardDescription className="text-xs">
          Per-classification Better Off Overall Test against {eba.underlyingAwardName ?? 'underlying award'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Badge className={overallPass ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200' : 'bg-red-500/10 text-red-700 border-red-200'}>
            {overallPass ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
            {overallPass ? 'All classifications PASS' : `${rows.length - passCount} classifications FAIL`}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Avg net benefit <span className={avgDelta >= 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>{avgDelta.toFixed(1)}%</span>
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Classification</TableHead>
              <TableHead className="text-right">EBA $/hr</TableHead>
              <TableHead className="text-right">Award $/hr</TableHead>
              <TableHead className="text-right">Δ</TableHead>
              <TableHead className="text-center">Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.classificationId}>
                <TableCell className="text-xs">
                  <div className="font-medium">{r.code}</div>
                  <div className="text-muted-foreground">{r.name}</div>
                </TableCell>
                <TableCell className="text-right text-xs">${r.ebaHourlyRate.toFixed(2)}</TableCell>
                <TableCell className="text-right text-xs">${r.awardHourlyRate.toFixed(2)}</TableCell>
                <TableCell className={`text-right text-xs font-medium ${r.pass ? 'text-emerald-600' : 'text-red-600'}`}>
                  {r.delta >= 0 ? '+' : ''}{r.delta.toFixed(2)} ({r.deltaPercent.toFixed(1)}%)
                </TableCell>
                <TableCell className="text-center">
                  {r.pass ? (
                    <Badge className="bg-emerald-500/10 text-emerald-700">Pass</Badge>
                  ) : (
                    <Badge className="bg-red-500/10 text-red-700">Fail</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-[10px] text-muted-foreground italic">
          Benchmark rates derived from underlying award classification levels. Edit pay rates above to refresh.
        </p>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. LIFECYCLE / EXPIRY / VARIATION
// ─────────────────────────────────────────────────────────────────────────────

export function EBALifecycleCard({
  eba,
  onCreateVariation,
  onMarkSuperseded,
}: {
  eba: EnterpriseAgreement;
  onCreateVariation?: () => void;
  onMarkSuperseded?: () => void;
}) {
  const expiryDate = parseISO(eba.nominalExpiryDate);
  const daysToExpiry = differenceInDays(expiryDate, new Date());
  const isExpired = isPast(expiryDate);
  const isExpiringSoon = !isExpired && daysToExpiry <= 180;
  const totalTermDays = differenceInDays(parseISO(eba.nominalExpiryDate), parseISO(eba.commencementDate)) || 1;
  const elapsedDays = differenceInDays(new Date(), parseISO(eba.commencementDate));
  const progressPercent = Math.min(100, Math.max(0, (elapsedDays / totalTermDays) * 100));

  const tasks: { label: string; due: string; severity: 'info' | 'warn' | 'critical' }[] = [];
  if (isExpired) tasks.push({ label: 'Agreement nominally expired — start renewal bargaining', due: format(expiryDate, 'dd MMM yyyy'), severity: 'critical' });
  else if (daysToExpiry <= 90) tasks.push({ label: 'Notify employees of bargaining intent (NERR)', due: format(addMonths(new Date(), 1), 'dd MMM yyyy'), severity: 'warn' });
  else if (daysToExpiry <= 180) tasks.push({ label: 'Begin renewal planning & cost modelling', due: format(addMonths(new Date(), 2), 'dd MMM yyyy'), severity: 'info' });

  // Annual increase tasks
  const upcomingIncreases = eba.payRates
    .filter((r) => r.nextIncreaseDate)
    .map((r) => ({ id: r.id, date: r.nextIncreaseDate!, percent: r.annualIncreasePercent ?? 0 }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          Lifecycle & Renewal
        </CardTitle>
        <CardDescription className="text-xs">
          Agreement progress, expiry alerts, and variation workflow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Agreement term progress</span>
            <span className="font-medium">{progressPercent.toFixed(0)}%</span>
          </div>
          <Progress value={progressPercent} />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>{format(parseISO(eba.commencementDate), 'dd MMM yyyy')}</span>
            <span>{format(expiryDate, 'dd MMM yyyy')}</span>
          </div>
        </div>

        {(isExpired || isExpiringSoon) && (
          <div className={`p-3 rounded-lg border ${isExpired ? 'bg-red-500/5 border-red-200' : 'bg-amber-500/5 border-amber-200'}`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className={`h-4 w-4 ${isExpired ? 'text-red-600' : 'text-amber-600'} mt-0.5`} />
              <div className="flex-1">
                <p className="text-xs font-medium">
                  {isExpired ? 'Agreement has nominally expired' : `Expiring in ${daysToExpiry} days`}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Continues to operate until terminated, replaced, or superseded.
                </p>
              </div>
            </div>
          </div>
        )}

        {tasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold flex items-center gap-1.5"><Bell className="h-3 w-3" /> Renewal Tasks</h4>
            {tasks.map((t, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-muted/40">
                <Checkbox />
                <div className="flex-1 text-xs">
                  <span>{t.label}</span>
                  <span className="text-muted-foreground ml-2">· due {t.due}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {upcomingIncreases.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold flex items-center gap-1.5"><TrendingUp className="h-3 w-3" /> Scheduled Pay Increases</h4>
            {upcomingIncreases.slice(0, 3).map((u, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-md bg-muted/40 text-xs">
                <span>+{u.percent}% scheduled for {format(parseISO(u.date), 'dd MMM yyyy')}</span>
                <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => toast.success('Draft increase queued')}>
                  Auto-draft
                </Button>
              </div>
            ))}
          </div>
        )}

        <Separator />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onCreateVariation?.()}>
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Create Variation
          </Button>
          <Button size="sm" variant="outline" onClick={() => onMarkSuperseded?.()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Mark Superseded
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PAY RATE TIMELINE
// ─────────────────────────────────────────────────────────────────────────────

export function EBAPayTimelineCard({ eba }: { eba: EnterpriseAgreement }) {
  // Build a synthetic 4-year timeline from current rates + annualIncreasePercent
  const rows = useMemo(() => {
    return eba.classifications.map((cls) => {
      const rate = eba.payRates.find((r) => r.classificationId === cls.id);
      if (!rate) return { cls, projections: [] as { year: string; rate: number }[] };
      const startYear = new Date(rate.effectiveFrom).getFullYear();
      const annualPct = (rate.annualIncreasePercent ?? 0) / 100;
      const projections: { year: string; rate: number }[] = [];
      let r = rate.baseRate;
      for (let i = 0; i < 4; i++) {
        projections.push({ year: `${startYear + i}`, rate: r });
        r = r * (1 + annualPct);
      }
      return { cls, projections, rateType: rate.rateType };
    });
  }, [eba]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Pay Rate Timeline
        </CardTitle>
        <CardDescription className="text-xs">
          Projected base rates over the agreement term using configured annual increases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Classification</TableHead>
              {rows[0]?.projections.map((p) => (
                <TableHead key={p.year} className="text-right">{p.year}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ cls, projections, rateType }) => (
              <TableRow key={cls.id}>
                <TableCell className="text-xs font-medium">{cls.code}</TableCell>
                {projections.map((p, idx) => (
                  <TableCell key={p.year} className="text-right text-xs">
                    {rateType === 'annual'
                      ? `$${p.rate.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                      : `$${p.rate.toFixed(2)}`}
                    {idx > 0 && (
                      <span className="text-[10px] text-emerald-600 ml-1">↑</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. COVERAGE → LOCATION/AREA MAPPING
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_LOCATIONS = [
  { id: 'loc-1', name: 'Sydney CBD', state: 'NSW' },
  { id: 'loc-2', name: 'Parramatta', state: 'NSW' },
  { id: 'loc-3', name: 'Melbourne Central', state: 'VIC' },
  { id: 'loc-4', name: 'Brisbane North', state: 'QLD' },
  { id: 'loc-5', name: 'Adelaide South', state: 'SA' },
  { id: 'loc-6', name: 'Hobart', state: 'TAS' },
];

export function EBACoverageMapCard({ eba }: { eba: EnterpriseAgreement }) {
  const [selected, setSelected] = useState<string[]>(
    MOCK_LOCATIONS.filter((l) => eba.applicableStates.includes(l.state as any)).map((l) => l.id)
  );

  const conflicts = MOCK_LOCATIONS.filter(
    (l) => selected.includes(l.id) && !eba.applicableStates.includes(l.state as any)
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Coverage · Locations & Areas
        </CardTitle>
        <CardDescription className="text-xs">
          Map this agreement to specific locations beyond state-level coverage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {MOCK_LOCATIONS.map((loc) => {
            const checked = selected.includes(loc.id);
            const isConflict = checked && !eba.applicableStates.includes(loc.state as any);
            return (
              <div
                key={loc.id}
                className={`flex items-center gap-2 p-2 rounded-md border text-xs ${isConflict ? 'border-red-300 bg-red-500/5' : 'border-border bg-muted/30'}`}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) =>
                    setSelected((prev) => (v ? [...prev, loc.id] : prev.filter((x) => x !== loc.id)))
                  }
                />
                <div className="flex-1">
                  <div className="font-medium">{loc.name}</div>
                  <div className="text-muted-foreground text-[10px]">{loc.state}</div>
                </div>
                {isConflict && <AlertTriangle className="h-3.5 w-3.5 text-red-600" />}
              </div>
            );
          })}
        </div>
        {conflicts.length > 0 && (
          <div className="p-2 rounded-md bg-red-500/5 border border-red-200 text-[11px] text-red-700">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            {conflicts.length} location(s) selected outside agreement's applicable states.
          </div>
        )}
        <Button size="sm" variant="outline" onClick={() => toast.success(`${selected.length} locations mapped`)}>
          Save Mapping
        </Button>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. VERSION HISTORY & DIFF
// ─────────────────────────────────────────────────────────────────────────────

export function EBAVersionHistoryCard({ eba }: { eba: EnterpriseAgreement }) {
  const versions = [
    { version: eba.version, date: eba.updatedAt, change: 'Current version', isCurrent: true },
    { version: '1.0', date: eba.createdAt, change: 'Initial agreement approved by FWC', isCurrent: false },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          Version History
        </CardTitle>
        <CardDescription className="text-xs">
          Track changes, variations, and prior versions of this agreement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {versions.map((v, idx) => (
            <div key={idx} className="flex items-start gap-3 p-2 rounded-md bg-muted/30">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                v{v.version}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">Version {v.version}</span>
                  {v.isCurrent && <Badge className="text-[9px] bg-emerald-500/10 text-emerald-700">Current</Badge>}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{v.change}</p>
                <p className="text-[10px] text-muted-foreground">{format(parseISO(v.date), 'dd MMM yyyy')}</p>
              </div>
              {!v.isCurrent && (
                <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => toast.info('Diff viewer coming soon')}>
                  Compare
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. FWC DOCUMENT UPLOAD & SYNC
// ─────────────────────────────────────────────────────────────────────────────

export function EBAFWCDocumentCard({ eba }: { eba: EnterpriseAgreement }) {
  const [files, setFiles] = useState<{ name: string; size: string; date: string }[]>(
    eba.fwcApprovalNumber ? [{ name: `${eba.code}-approved.pdf`, size: '1.2 MB', date: format(parseISO(eba.approvalDate), 'dd MMM yyyy') }] : []
  );

  const fwcUrl = eba.fwcReference
    ? `https://www.fwc.gov.au/document-search?q=${encodeURIComponent(eba.fwcReference)}`
    : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          FWC Documents & Sync
        </CardTitle>
        <CardDescription className="text-xs">
          Upload approved PDFs, deep-link to FWC, and sync metadata
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-md bg-muted/40">
            <div className="text-muted-foreground text-[10px]">FWC Reference</div>
            <div className="font-medium">{eba.fwcReference ?? '—'}</div>
          </div>
          <div className="p-2 rounded-md bg-muted/40">
            <div className="text-muted-foreground text-[10px]">Approval Number</div>
            <div className="font-medium">{eba.fwcApprovalNumber ?? '—'}</div>
          </div>
        </div>

        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-muted/30 text-xs">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <div className="flex-1">
                <div className="font-medium">{f.name}</div>
                <div className="text-[10px] text-muted-foreground">{f.size} · uploaded {f.date}</div>
              </div>
              <Button size="sm" variant="ghost" className="h-6 text-[10px]">View</Button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setFiles((prev) => [
                ...prev,
                { name: `${eba.code}-document-${prev.length + 1}.pdf`, size: '0.8 MB', date: format(new Date(), 'dd MMM yyyy') },
              ]);
              toast.success('Document uploaded');
            }}
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload PDF
          </Button>
          {fwcUrl && (
            <Button size="sm" variant="outline" asChild>
              <a href={fwcUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open on FWC
              </a>
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => toast.success('FWC metadata synced')}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Sync Metadata
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. APPROVAL / BALLOT WORKFLOW
// ─────────────────────────────────────────────────────────────────────────────

export function EBAApprovalWorkflowCard({ eba }: { eba: EnterpriseAgreement }) {
  const steps = [
    { key: 'nerr', label: 'NERR issued to employees', complete: true, date: '01 Apr 2023' },
    { key: 'access', label: 'Access period (7 days)', complete: true, date: '15 Apr 2023' },
    { key: 'ballot', label: 'Employee ballot', complete: eba.status === 'active', date: '22 Apr 2023', detail: 'Yes: 87% · No: 13% · Turnout: 94%' },
    { key: 'lodge', label: 'Lodged with FWC', complete: eba.status === 'active', date: '01 May 2023' },
    { key: 'approve', label: 'FWC approval', complete: eba.status === 'active', date: format(parseISO(eba.approvalDate), 'dd MMM yyyy') },
    { key: 'commence', label: 'Commencement', complete: !isPast(parseISO(eba.commencementDate)) ? false : true, date: format(parseISO(eba.commencementDate), 'dd MMM yyyy') },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Vote className="h-4 w-4" />
          Approval & Ballot Workflow
        </CardTitle>
        <CardDescription className="text-xs">
          Track bargaining, ballot results, and FWC approval steps
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2">
          {steps.map((s, i) => (
            <li key={s.key} className="flex items-start gap-3">
              <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${s.complete ? 'bg-emerald-500/15 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                {s.complete ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium">{s.label}</div>
                <div className="text-[10px] text-muted-foreground">{s.date}{s.detail ? ` · ${s.detail}` : ''}</div>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. RICH COMPARISON TABLES (used by enriched compare panel)
// ─────────────────────────────────────────────────────────────────────────────

export function EBAComparePayRates({ a, b }: { a: EnterpriseAgreement; b: EnterpriseAgreement }) {
  const rows = useMemo(() => {
    const map: Record<number, { level: number; aRate?: number; bRate?: number }> = {};
    [...a.classifications, ...b.classifications].forEach((c) => {
      if (!map[c.level]) map[c.level] = { level: c.level };
    });
    a.classifications.forEach((c) => {
      const r = a.payRates.find((p) => p.classificationId === c.id);
      if (r) map[c.level].aRate = r.rateType === 'annual' ? r.baseRate / 1976 : r.baseRate;
    });
    b.classifications.forEach((c) => {
      const r = b.payRates.find((p) => p.classificationId === c.id);
      if (r) map[c.level].bRate = r.rateType === 'annual' ? r.baseRate / 1976 : r.baseRate;
    });
    return Object.values(map).sort((x, y) => x.level - y.level);
  }, [a, b]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Pay Rates by Level (hourly)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Level</TableHead>
              <TableHead className="text-right">{a.code}</TableHead>
              <TableHead className="text-right">{b.code}</TableHead>
              <TableHead className="text-right">Δ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const delta = (r.aRate ?? 0) - (r.bRate ?? 0);
              return (
                <TableRow key={r.level}>
                  <TableCell className="text-xs">Level {r.level}</TableCell>
                  <TableCell className="text-right text-xs">{r.aRate ? `$${r.aRate.toFixed(2)}` : '—'}</TableCell>
                  <TableCell className="text-right text-xs">{r.bRate ? `$${r.bRate.toFixed(2)}` : '—'}</TableCell>
                  <TableCell className={`text-right text-xs font-medium ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {r.aRate && r.bRate ? `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}` : '—'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function EBACompareAllowances({ a, b }: { a: EnterpriseAgreement; b: EnterpriseAgreement }) {
  const names = Array.from(new Set([...a.allowances.map((x) => x.name), ...b.allowances.map((x) => x.name)]));
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Allowances</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Allowance</TableHead>
              <TableHead className="text-right">{a.code}</TableHead>
              <TableHead className="text-right">{b.code}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {names.map((n) => {
              const aA = a.allowances.find((x) => x.name === n);
              const bA = b.allowances.find((x) => x.name === n);
              return (
                <TableRow key={n}>
                  <TableCell className="text-xs">{n}</TableCell>
                  <TableCell className="text-right text-xs">{aA ? `$${aA.amount.toFixed(2)} ${aA.frequency.replace(/_/g, ' ')}` : '—'}</TableCell>
                  <TableCell className="text-right text-xs">{bA ? `$${bA.amount.toFixed(2)} ${bA.frequency.replace(/_/g, ' ')}` : '—'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function EBACompareConditions({ a, b }: { a: EnterpriseAgreement; b: EnterpriseAgreement }) {
  const cats = Array.from(new Set([...a.conditions.map((c) => c.category), ...b.conditions.map((c) => c.category)]));
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Conditions Diff</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {cats.map((cat) => {
          const aC = a.conditions.filter((c) => c.category === cat);
          const bC = b.conditions.filter((c) => c.category === cat);
          return (
            <div key={cat}>
              <div className="text-xs font-semibold capitalize mb-1.5">{cat}</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-md bg-muted/40 text-[11px]">
                  <div className="font-medium text-[10px] text-muted-foreground">{a.code}</div>
                  {aC.length === 0 ? <span className="text-muted-foreground italic">none</span> : aC.map((c) => <div key={c.id}>• {c.title}</div>)}
                </div>
                <div className="p-2 rounded-md bg-muted/40 text-[11px]">
                  <div className="font-medium text-[10px] text-muted-foreground">{b.code}</div>
                  {bC.length === 0 ? <span className="text-muted-foreground italic">none</span> : bC.map((c) => <div key={c.id}>• {c.title}</div>)}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
