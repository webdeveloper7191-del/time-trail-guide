/**
 * Qualification and rate-card mapping between an agency's dialect and the
 * tenant's own master data (Skills, Positions). Suggestions are fuzzy-matched
 * but never auto-committed — a human confirms each row.
 */
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, CheckCircle2, Plus, Sparkles, Trash2, Info } from 'lucide-react';
import { usePositions } from '@/lib/masterData/positionsStore';
import { skillsStore } from '@/lib/masterData/skillsStore';
import {
  AgencyPartnerStore,
  type AgencyIntegrationConfig,
  type AgencyPartnerApplication,
} from '@/lib/agencyPartnerApplicationStore';
import {
  rateVariance,
  suggestPosition,
  suggestSkill,
  type ChargeBasis,
  type QualificationMapping,
  type RateCardMapping,
} from '@/lib/agencyMappingEngine';

const CURRENT_USER = 'admin@rostered.ai';

function Hint({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground inline-block ml-1 align-text-bottom" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Qualifications
// ---------------------------------------------------------------------------
export function QualificationMappingTab({ app, cfg }: { app: AgencyPartnerApplication; cfg: AgencyIntegrationConfig }) {
  const skills = skillsStore.use();
  const activeSkills = skills.filter(s => s.status === 'active');
  const rows = cfg.qualificationMappings ?? [];
  const [newLabel, setNewLabel] = useState('');

  const update = (next: QualificationMapping[], note: string) =>
    AgencyPartnerStore.updateIntegration(app.id, CURRENT_USER, { qualificationMappings: next }, note);

  const patch = (id: string, p: Partial<QualificationMapping>) =>
    update(rows.map(r => (r.id === id ? { ...r, ...p } : r)), 'Qualification mapping updated.');

  const add = (label: string) => {
    const clean = label.trim();
    if (!clean) return;
    if (rows.some(r => r.agencyQualificationLabel.toLowerCase() === clean.toLowerCase())) return;
    update([...rows, {
      id: `qmap_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      agencyQualificationLabel: clean,
      mandatory: true,
      evidenceRequired: true,
    }], `Added qualification label "${clean}".`);
    setNewLabel('');
  };

  const setSkill = (id: string, skillId: string) => {
    const s = activeSkills.find(x => x.id === skillId);
    patch(id, {
      skillId,
      skillLabel: s?.label,
      mandatory: s?.mandatoryForAssignment ?? true,
      evidenceRequired: s?.requiresEvidence ?? true,
      confirmedAt: new Date().toISOString(),
      confirmedBy: CURRENT_USER,
      ignored: false,
    });
  };

  const autoMatch = () => {
    let matched = 0;
    const next = rows.map(r => {
      if (r.skillId || r.ignored) return r;
      const sug = suggestSkill(r.agencyQualificationLabel, activeSkills);
      if (!sug || sug.confidence < 75) return r;
      matched++;
      return {
        ...r,
        skillId: sug.target.id,
        skillLabel: sug.target.label,
        mandatory: sug.target.mandatoryForAssignment,
        evidenceRequired: sug.target.requiresEvidence,
        confirmedAt: new Date().toISOString(),
        confirmedBy: `${CURRENT_USER} (auto ${sug.confidence}%)`,
      };
    });
    if (matched > 0) update(next, `Auto-matched ${matched} qualification label(s).`);
  };

  const unresolved = rows.filter(r => !r.skillId && !r.ignored).length;

  return (
    <div className="space-y-4">
      <Card className="p-3 flex items-start gap-2 text-sm">
        {unresolved > 0
          ? <><AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" /><span>{unresolved} agency qualification label{unresolved === 1 ? '' : 's'} unmapped. Unmapped labels are ignored during candidate screening, so mandatory checks (First Aid, CPR, WWCC) can silently pass.</span></>
          : rows.length === 0
            ? <><AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" /><span>Add the qualification labels this agency uses, then bind each one to a tenant skill.</span></>
            : <><CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" /><span>Every agency qualification label resolves to a tenant skill.</span></>}
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Tenant skills come from Master data → Skills, so custom tenant skills are available here automatically.
        </p>
        <Button size="sm" variant="outline" onClick={autoMatch}>
          <Sparkles className="h-3.5 w-3.5 mr-1" />Suggest matches
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agency qualification label</TableHead>
              <TableHead>Tenant skill</TableHead>
              <TableHead className="w-24">Mandatory<Hint text="Blocking: a candidate without this skill is rejected on inbound submission." /></TableHead>
              <TableHead className="w-24">Evidence<Hint text="The agency must attach a certificate reference in the candidate payload." /></TableHead>
              <TableHead className="w-24">Ignore<Hint text="Accept the label but never use it for matching — silences 'unrecognised qualification' warnings." /></TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => {
              const sug = !r.skillId && !r.ignored ? suggestSkill(r.agencyQualificationLabel, activeSkills) : null;
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs align-top pt-4">
                    {r.agencyQualificationLabel}
                    {sug && (
                      <button
                        type="button"
                        onClick={() => setSkill(r.id, sug.target.id)}
                        className="block mt-1 text-[11px] text-primary hover:underline"
                      >
                        Suggested: {sug.target.label} ({sug.confidence}%)
                      </button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select value={r.skillId ?? ''} onValueChange={v => setSkill(r.id, v)} disabled={r.ignored}>
                      <SelectTrigger className="w-56"><SelectValue placeholder="Pick tenant skill…" /></SelectTrigger>
                      <SelectContent>
                        {activeSkills.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Switch checked={r.mandatory} disabled={r.ignored} onCheckedChange={v => patch(r.id, { mandatory: v })} /></TableCell>
                  <TableCell><Switch checked={r.evidenceRequired} disabled={r.ignored} onCheckedChange={v => patch(r.id, { evidenceRequired: v })} /></TableCell>
                  <TableCell><Switch checked={!!r.ignored} onCheckedChange={v => patch(r.id, { ignored: v, skillId: v ? undefined : r.skillId })} /></TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => update(rows.filter(x => x.id !== r.id), 'Qualification mapping removed.')}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell colSpan={6}>
                <div className="flex gap-2">
                  <Input
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') add(newLabel); }}
                    placeholder="Add agency label (e.g. HLTAID009 CPR, WWCC, Cert III)"
                  />
                  <Button variant="outline" onClick={() => add(newLabel)}><Plus className="h-4 w-4 mr-1" />Add</Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rate cards
// ---------------------------------------------------------------------------
export function RateCardMappingTab({ app, cfg }: { app: AgencyPartnerApplication; cfg: AgencyIntegrationConfig }) {
  const positions = usePositions();
  const activePositions = useMemo(() => positions.filter(p => p.status === 'active'), [positions]);
  const rows = cfg.rateCardMappings ?? [];

  const update = (next: RateCardMapping[], note: string) =>
    AgencyPartnerStore.updateIntegration(app.id, CURRENT_USER, { rateCardMappings: next }, note);

  const patch = (id: string, p: Partial<RateCardMapping>) =>
    update(rows.map(r => (r.id === id ? { ...r, ...p } : r)), 'Rate-card mapping updated.');

  // Seed from onboarding rate cards once.
  useEffect(() => {
    if ((cfg.rateCardMappings?.length ?? 0) > 0) return;
    const source = app.rateCards ?? [];
    if (source.length === 0) return;
    const seeded: RateCardMapping[] = source.map(rc => {
      const sug = suggestPosition(rc.roleName ?? '', activePositions);
      return {
        id: `rmap_${rc.id}`,
        agencyRateCardId: rc.id,
        agencyRoleLabel: rc.roleName ?? 'Unnamed role',
        positionId: sug && sug.confidence >= 85 ? sug.target.id : undefined,
        positionLabel: sug && sug.confidence >= 85 ? sug.target.label : undefined,
        chargeBasis: 'hourly' as ChargeBasis,
        agencyBaseRate: Number((rc as { baseRate?: number }).baseRate ?? 0),
        weekendMultiplier: 1.5,
        publicHolidayMultiplier: 2.5,
        overtimeMultiplier: 1.5,
      };
    });
    update(seeded, 'Seeded rate-card mappings from onboarding.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.id]);

  const addRow = () => update([...rows, {
    id: `rmap_${Date.now()}`,
    agencyRoleLabel: '',
    chargeBasis: 'hourly',
    agencyBaseRate: 0,
  }], 'Rate-card line added.');

  const unresolved = rows.filter(r => !r.positionId).length;
  const overCeiling = rows.filter(r => r.maxApprovedRate != null && r.agencyBaseRate > r.maxApprovedRate).length;

  return (
    <div className="space-y-4">
      <Card className="p-3 space-y-1 text-sm">
        <div className="flex items-start gap-2">
          {unresolved === 0 && overCeiling === 0 && rows.length > 0
            ? <><CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" /><span>All rate-card lines are bound to a tenant position and within the approved ceiling.</span></>
            : <><AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" /><span>
                {unresolved > 0 && `${unresolved} line(s) not bound to a tenant position. `}
                {overCeiling > 0 && `${overCeiling} line(s) exceed the approved ceiling — dispatch is blocked for those roles.`}
                {rows.length === 0 && 'No rate-card lines yet.'}
              </span></>}
        </div>
        <p className="text-xs text-muted-foreground">
          The agency charge rate is what they invoice; the internal benchmark is your award-resolved cost for an own employee. Variance drives the cost comparison shown when dispatching a shift.
        </p>
      </Card>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[160px]">Agency role label</TableHead>
              <TableHead className="min-w-[200px]">Tenant position</TableHead>
              <TableHead>Basis</TableHead>
              <TableHead>Charge rate</TableHead>
              <TableHead>Internal benchmark<Hint text="Your fully-loaded hourly cost for an employee in this position. Used to show cost variance." /></TableHead>
              <TableHead>Ceiling<Hint text="Hard cap. Dispatch to this agency is blocked when the charge rate exceeds it." /></TableHead>
              <TableHead>Variance</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => {
              const variance = rateVariance(r);
              const sug = !r.positionId && r.agencyRoleLabel ? suggestPosition(r.agencyRoleLabel, activePositions) : null;
              const breach = r.maxApprovedRate != null && r.agencyBaseRate > r.maxApprovedRate;
              return (
                <TableRow key={r.id}>
                  <TableCell className="align-top pt-3">
                    <Input
                      className="h-8 w-40 text-xs"
                      value={r.agencyRoleLabel}
                      onChange={e => patch(r.id, { agencyRoleLabel: e.target.value })}
                      placeholder="e.g. RN Div 1"
                    />
                    {sug && (
                      <button
                        type="button"
                        onClick={() => patch(r.id, { positionId: sug.target.id, positionLabel: sug.target.label, confirmedAt: new Date().toISOString(), confirmedBy: CURRENT_USER })}
                        className="block mt-1 text-[11px] text-primary hover:underline"
                      >
                        Suggested: {sug.target.label} ({sug.confidence}%)
                      </button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={r.positionId ?? ''}
                      onValueChange={v => {
                        const p = activePositions.find(x => x.id === v);
                        patch(r.id, { positionId: v, positionLabel: p?.label, confirmedAt: new Date().toISOString(), confirmedBy: CURRENT_USER });
                      }}
                    >
                      <SelectTrigger className="w-52 h-8 text-xs"><SelectValue placeholder="Pick position…" /></SelectTrigger>
                      <SelectContent>
                        {activePositions.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={r.chargeBasis} onValueChange={v => patch(r.id, { chargeBasis: v as ChargeBasis })}>
                      <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="shift">Per shift</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number" step="0.01"
                      className={`h-8 w-24 text-xs ${breach ? 'border-destructive' : ''}`}
                      value={r.agencyBaseRate}
                      onChange={e => patch(r.id, { agencyBaseRate: Number(e.target.value) })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number" step="0.01"
                      className="h-8 w-24 text-xs"
                      value={r.tenantBenchmarkRate ?? ''}
                      onChange={e => patch(r.id, { tenantBenchmarkRate: e.target.value === '' ? undefined : Number(e.target.value) })}
                      placeholder="—"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number" step="0.01"
                      className="h-8 w-24 text-xs"
                      value={r.maxApprovedRate ?? ''}
                      onChange={e => patch(r.id, { maxApprovedRate: e.target.value === '' ? undefined : Number(e.target.value) })}
                      placeholder="—"
                    />
                  </TableCell>
                  <TableCell className="text-xs">
                    {breach
                      ? <Badge variant="destructive">Over ceiling</Badge>
                      : variance
                        ? <Badge variant={variance.tone === 'ok' ? 'secondary' : 'outline'} className={variance.tone === 'bad' ? 'border-destructive text-destructive' : variance.tone === 'warn' ? 'border-amber-500 text-amber-700' : ''}>{variance.label}</Badge>
                        : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => update(rows.filter(x => x.id !== r.id), 'Rate-card line removed.')}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell colSpan={8}>
                <Button variant="outline" size="sm" onClick={addRow}><Plus className="h-4 w-4 mr-1" />Add rate-card line</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
